$(document).ready(function() {
	var server = null;

	$('.database').attr('href', server + '/bootstrap-perf/_utils/database.html?bootstrap-perf').html(server);

	$('#changeDBDropdown').on('change', function() {
		server = $(this).val();
		$('#databaseName, #changeDatabaseName').toggleClass('hide');
		$('.database').html(server);
	}).trigger('change');

	$('#changeServerLink').on('click', function() {
		$('#databaseName, #changeDatabaseName').toggleClass('hide');
	});


	$('#results_link, #upload_link').on('click', function(e) {
		$('.results, .upload').toggleClass('hide');
		$('#results_link, #upload_link').removeClass('active');
		$(this).addClass('active');
		return false;
	});

	$('#component, #metric').attr("selectedIndex", -1).on('change', function() {
		$('#chartDiv').html('<center>Loading</center>');
		var component = $('#component').val();
		var metric = $('#metric').val();
		getStats(component, metric).then(function(res) {
			$('#chartDiv').empty();
			drawGraph([res]);
		}, function(err) {
			showModal('Error', 'Could not load results from remote server : ' + err.statusText);
		});

	});

	function getStats(component, metric) {
		return $.Deferred(function(dfd) {
			$.getJSON(server + 'bootstrap-perf/_design/data/_view/stats', {
				startkey: JSON.stringify([component, metric]),
				endkey: JSON.stringify([component, metric, {}]),
				group: true
			}).then(function(data) {
				var result = _.map(data.rows, function(obj, index) {
					return [obj.key[2], obj.value.sum / obj.value.count];
				});
				dfd.resolve(result);
			}, dfd.reject);
		});
	}

	function drawGraph(data) {
		$.jqplot("chartDiv", data, {
			// Turns on animatino for all series in this plot.
			animate: true,
			// Will animate plot on calls to plot1.replot({resetAxes:true})
			animateReplot: true,
			series: [],
			axesDefaults: {
				pad: 0
			},
			seriesDefaults: {
				rendererOptions: {
					smooth: true
				},
				lineWidth: 1,
				markerOptions: {
					size: 2,
					style: "circle"
				}
			},
			axes: {
				// These options will set up the x axis like a category axis.
				xaxis: {
					renderer: $.jqplot.CategoryAxisRenderer,
					label: 'Versions',
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					tickRenderer: $.jqplot.CanvasAxisTickRenderer,
					tickOptions: {
						angle: -90,
						mark: 'outside',
						showMark: true,
						showGridline: true,
						markSize: 4,
						show: true,
						showLabel: true,
					},
					showTicks: true, // wether or not to show the tick labels,
					showTickMarks: true,
				},
				yaxis: {
					tickOptions: {},
					rendererOptions: {
						forceTickAt0: false
					}
				}
			},
			highlighter: {
				show: true,
				showLabel: true,
				tooltipAxes: 'y',
				sizeAdjust: 7.5,
				tooltipLocation: 'ne'
			}
		});
	}


	// Upload files
	var files = null;
	var tmpl = $('#list').html();
	$('#list').empty();

	function displayFileInfo(files) {
		// files is a FileList of File objects. List some properties.
		var output = [];
		for (var i = 0, f; f = files[i]; i++) {
			output.push(tmpl.replace(/{name}/g, f.name).replace(/{type}/, f.type || 'n/a').replace(/{date}/, f.lastModifiedDate ? f.lastModifiedDate.toLocaleString() : '').replace(/{size}/, f.size / 1024));
		}
		$('#list').html(output.join(''));
	}


	$('#uploadButton').click(function() {
		if (files === null || files.length === 0) {
			showModal('Cannot Upload', 'Select at least 1 file to upload');
			return;
		}

		$(this).attr('disabled', true).html("Uploading ... ");
		var result = [],
			fileCount = 0;

		function guid() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000)
					.toString(16)
					.substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
				s4() + '-' + s4() + s4() + s4();
		}

		function onLoadHandler(f) {
			return function(e) {
				var id = guid();
				try {
					var rows = e.target.result.split(/\n/);
					var keys = rows[0].split(/\,/);
					for (var i = 1; i < rows.length; i++) {
						var row = {}, values = rows[i].split(/,/);
						if (values.length !== keys.length) {
							continue;
						}
						for (var j = 0; j < values.length; j++) {
							row[keys[j]] = values[j];
						}
						var parts = row.url.trim().split(/\//);
						row.component = parts[1].split(/.html/)[0];
						row.version = parts[0].substring(1);
						row.set = id

						result.push(row);
					}
					$('li[data-filename="' + f.name + '"]').append('&nbsp;&nbsp;<span class=badge>' + result.length + '</span>');
					if (++fileCount >= files.length) {
						$.ajax({
							url: server + 'bootstrap-perf/_bulk_docs',
							data: JSON.stringify({
								docs: result
							}),
							method: 'POST',
							contentType: 'application/json',
						}).then(function(data) {
							$('#uploadButton').attr('disabled', false).html("Upload Files");
							$('#list').empty();
							showModal('Upload Successful', 'Uploaded <strong>' + data.length + '</strong> records to the server at <br/>' + server + 'bootstrap-perf/_utils/database.html?bootstrap-perf');
						}, function(err) {
							$('#list').empty();
							$('#uploadButton').attr('disabled', false).html("Upload Files");
							showModal('Error', 'Could not upload data. Server says : ' + err.statusText);
						});
					}
				} catch (e) {
					$('#uploadButton').attr('disabled', false).html("Upload Files");
					$('#list').empty();
					showModal('Error Parsing Files', 'Could not parse <strong>' + f.name + '</strong><br/> Caused error <code>' + e.message + '</code>');
				}
			}
		}

		for (var i = 0, f; f = files[i]; i++) {
			var reader = new FileReader();
			reader.onload = onLoadHandler(f);
			reader.readAsText(f);
		}
	});

	var fileInput = document.getElementById('file_control'),
		dropZone = document.getElementById('drop_zone');

	dropZone.addEventListener('click', function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		fileInput.click();
	}, false);

	dropZone.addEventListener('dragover', function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy';
		$(this).addClass('fileDraggedOver');
	}, false);
	dropZone.addEventListener('dragleave', function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		$(this).removeClass('fileDraggedOver');
	}, false);

	dropZone.addEventListener('drop', function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		files = evt.dataTransfer.files;
		displayFileInfo(files);
	}, false);

	fileInput.addEventListener('change', function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		files = evt.target.files;
		displayFileInfo(files);
	}, false);

	function showModal(title, body) {
		$('.modal .modal-title').html(title);
		$('.modal .modal-body').html(body);
		$('.modal').modal(true);
	}
});