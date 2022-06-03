class StackedBasicAreaChartEU {

	constructor(element_id) {

		// Load data and keep only year, country, gas, coal, oil, solar, wind, hydro
		d3.csv("./data/World_Energy_Consumption.csv",
		d => {
			return {
				year: d3.timeParse("%Y")(d.year),
				gas: d.gas_consumption,
				coal: d.coal_consumption,
				oil: d.oil_consumption,
				solar: d.solar_consumption,
				wind: d.wind_consumption,
				hydro: d.hydro_consumption,
				country: d.country
			}
		}).then((data) => {

			////////////////////
			// DATA AND MAIN SVG

			// Data loaded successfully
			var energy_data = data;
			console.log('Data loaded')

			// Filter data to use "World" country and years between 1965 and 2019
			const post_1965 = new Date('January 1, 1964 00:00:01');
			const pre_2020 = new Date('January 1, 2020 00:00:00');
			const to_include = ['Europe']
			energy_data = energy_data.filter(x => 
				x.year.getTime() < pre_2020.getTime() &&
				x.year.getTime() > post_1965.getTime() && 
				to_include.includes(x.country))

			// Prepare constants for stacked data
			const energy_keys = ["none","gas", "coal", "oil", "solar", "wind", "hydro"]
			const color_mappings = ['#FFFFFF','#7B6D8D','#B3A394','#595457','#FFD166','#226F54','#73C1C6']
			const offset = d3.stackOffsetExpand
			const order = d3.stackOrderDescending

			// Create stacked with full range of values
			var stackGen = d3.stack()
				.keys(energy_keys)
				.order(order);
			var stackedData = stackGen(energy_data)
	
			// Create stacked with expanded range of values (between 0 and 1)
			var stackGen_expanded = d3.stack()
				.keys(energy_keys)
				.order(order)
				.offset(offset);
			var stackedDataExpanded = stackGen_expanded(energy_data)

			// Create main svg with dimensions
			const margin = {top: 40, right: 30, bottom: 50, left: 50},
			width = 860 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom;

			const svg = d3.select("#"+element_id)
				.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
			var inner = svg.append("g")
					.attr("transform",
						  "translate(" + margin.left + "," + margin.top + ")");

			// Create X axis (date format)
			const x_axis = d3.scaleTime()
						.domain(d3.extent(energy_data, d => d.year))
						.range([ 0, width]);

			// Add X axis, rotate tick labels to fit more date ticks
			var X_AXIS = inner.append("g")
			   .attr("transform", "translate(0,"+height+")")
			   .call(d3.axisBottom(x_axis).ticks(d3.timeYear.every(3))) // tick every 2 years
			   .selectAll("text")  
			   .style("text-anchor", "end")
			   .attr("dx", "-.3em")
			   .attr("dy", ".5em")
			   .attr("transform", "rotate(-35)"); // rotate by 35 degrees

			// Compute max y value tick for full range
			// Take max over all entries (years) of sum of all energies
			const y_max = d3.max(
								energy_data, d => 
									parseInt(d.gas) + 
									parseInt(d.coal) + 
									parseInt(d.oil) +
									parseInt(d.solar) + 
									parseInt(d.wind) + 
									parseInt(d.hydro)
								)*1.1

			// Create Y axis (default full range)
			var y_axis = d3.scaleLinear()
				.domain([0, y_max])
				.range([ height, 0 ]);

			// Add Y axis
			var Y_AXIS = inner.append("g")
				.call(d3.axisLeft(y_axis));

			// Define color palette
			const colorScale = d3.scaleOrdinal()
				.domain(energy_keys)
				.range(color_mappings)

			// Add X axis label:
			var X_AXIS_LABEL = inner.append("text")
				.attr("font-family", "-apple-system")
				.attr("text-anchor", "end")
				.attr("x", (width+margin.left+margin.right)/2)
				.attr("y", height+margin.top)
				.text("Time (years)");

			// Add Y axis label:
			var Y_AXIS_LABEL = svg.append("text")
				.attr("font-family", "-apple-system")
				.attr("text-anchor", "end")
				.attr("x", 0)
				.attr("y", 20)
				.text("TWh")
				.attr("text-anchor", "start")

			// Wrapper for update function
			function update_wrapper(data_, shift_val, y_axis_text) {
				// Update y axis and label
				y_axis.domain([ 0, shift_val ]);
				Y_AXIS.transition().duration(1000).call(d3.axisLeft(y_axis).ticks(10))
				Y_AXIS_LABEL.transition().duration(1000).text(y_axis_text);
				// Get selection of data
				var chart_selection = inner.select("g") // If you don't select group first
										 .selectAll("path") // one area/path is shifted down
										 .data(data_)
				// Catch every data element not yet been bound to the selected DOM elements
				chart_selection
					.enter()
					.append("path")
					.attr("class", function(d) { return "myAreaEU EU" + d.key })
					.merge(chart_selection)
					.transition()
					.duration(1000)
					.style("fill", (d) => colorScale(d.key))
					.attr("d", d3.area()
						.x((d) => x_axis(d.data.year))
						.y0((d) => y_axis(d[0]+shift_val))
						.y1((d) => y_axis(d[1]+shift_val)));
				// Remove the already existing DOM elements without an associated data item after enter()
				chart_selection.exit() 
					.remove();		
			}

			// Individual update functions for full and expanded data
			function update_full() {
				update_wrapper(stackedData, y_max, "TWh");
			}
			function update_expanded() {
				update_wrapper(stackedDataExpanded, 1, "Proportion");
			}

			// Get buttons to trigger chart update
			var full_range_button = d3.select("#full-range-eu")
			var expanded_button = d3.select("#expanded-eu")

			// Implement click functionality
			expanded_button.on("click",function(){update_expanded()})
			full_range_button.on("click",function(){update_full()})

			// Initialize chart with full range
			update_full()


			// What to do when one group is hovered
			var highlight = function(d){
				console.log(d)
				// reduce opacity of all groups
				d3.selectAll(".myAreaEU")
					.transition()
					.duration(300)
					.style("opacity", .1)
				// expect the one that is hovered
				d3.select(".EU"+d)
					.transition()
					.duration(300)
					.style("opacity", 1)
			}
			
				// And when it is not hovered anymore
			var noHighlight = function(d){
				d3.selectAll(".myAreaEU")
				.transition()
				.duration(500)
				.style("opacity", 1)
			}

			// Trick to capitalize first letter of string (for legend)
			const capitalizeFirstLetter = ([ first, ...rest ], locale = navigator.language) =>
  				first.toLocaleUpperCase(locale) + rest.join('')

			// Rectangles for the legend
			var size = 20
			svg.selectAll("myrectEU")
				.data(energy_keys.slice(1))
				.enter()
				.append("rect")
				.attr("x", function(d,i){ return width/3 + i*(size+50)})
				.attr("y", 0)
				.attr("width", size)
				.attr("height", size)
				.style("fill", function(d){ return colorScale(d)})
				.on("mouseover", highlight)
				.on("mouseleave", noHighlight)
		
			// Labels associated to each rectangle in legend
			svg.selectAll("mylabelsEU")
				.data(energy_keys.slice(1))
				.enter()
				.append("text")
				.attr("x", function(d,i){ return width/3 + i*(size+50)})
				.attr("y", size*1.5)
				.style("fill", function(d){ return colorScale(d)})
				.text(function(d){ return capitalizeFirstLetter(d)})
				.attr("text-anchor", "left")
				.style("alignment-baseline", "middle")
				.on("mouseover", highlight)
				.on("mouseleave", noHighlight)
			
		});
	}
}

function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

whenDocumentLoaded(() => {
	plot_object = new StackedBasicAreaChartEU('stacked-basic-area-chart-eu');
});
