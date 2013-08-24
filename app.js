$(document).ready(function() {
	$('#component, #metric').on('change', function() {
		$('#chartDiv').html('<center>Loading</center>');
		var metric = $('#metric').val();
		getData().then(function(data) {
			$('#chartDiv').empty();
			var plot = _.sortBy(_.map(data, function(o, index, obj) {
				return [index, parseFloat(o.value[metric])];
			}), function(obj) {
				return obj[0];
			});
			drawGraph([plot]);
		});
	});



	var component = {
		name: $('#component').val(),
		data: {}
	};

	function getData() {
		return $.Deferred(function(dfd) {
			var selectedComponent = $('#component').val()
			if (component.name !== selectedComponent || _.isEmpty(component.data)) {
				$.getJSON('http://axemclion.iriscouch.com/bootstrap-perf/_design/data/_view/component?key=%22' + selectedComponent + '%22').then(function(data) {
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
					smooth: false
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
					label: "Versions",
					tickInterval: 1,
					drawMajorGridlines: true,
					drawMinorGridlines: false,
					drawMajorTickMarks: false,
					rendererOptions: {
						tickInset: 1,
						minorTicks: 1
					}
				},
				yaxis: {
					tickOptions: {
						formatString: "$%'d"
					},
					rendererOptions: {
						forceTickAt0: true
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