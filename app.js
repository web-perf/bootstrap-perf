$(document).ready(function() {
	//var server = 'http://axemclion.iriscouch.com:5984';
	var server = 'http://localhost:5984/bootstrap-perf/';

	$('#component, #metric').on('change', function() {
		$('#chartDiv').html('<center>Loading</center>');
		var component = $('#component').val();
		var metric = $('#metric').val();
		getStats(component, metric).then(function(res) {
			$('#chartDiv').empty();
			drawGraph(res);
		});

	});


	function getStats(component, metric) {
		return $.Deferred(function(dfd) {
			$.getJSON(server + '_design/data/_view/stats', {
				startkey: JSON.stringify([component, metric]),
				endkey: JSON.stringify([component, metric, {}]),
				group: true
			}).then(function(data) {
				var result = _.map(data.rows, function(obj, index) {
					return [obj.key[2], obj.value.sum / obj.value.count];
				});
				dfd.resolve(result);
			});
		});
	}


	var component = {
		name: $('#component').val(),
		data: {}
	};

	function getData() {
		return $.Deferred(function(dfd) {
			var selectedComponent = $('#component').val()
			if (component.name !== selectedComponent || _.isEmpty(component.data)) {
				$.getJSON(server + 'bootstrap-perf/_design/data/_view/component?key=%22' + selectedComponent + '%22').then(function(data) {
					component = {
						name: selectedComponent,
						data: data.rows
					}
					dfd.resolve(component.data);
				}, dfd.reject);
			} else {
				dfd.resolve(component.data);
			}
		});
	}

	function drawGraph(data) {
		console.log(data);
		$.jqplot("chartDiv", [data], {
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
});