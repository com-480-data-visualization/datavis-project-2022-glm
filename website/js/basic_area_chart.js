class BasicAreaChart {

	constructor(element_id) {


		const data_promise = d3.csv("./data/World_Energy_Consumption.csv",
		d => {
			return {
				date: d3.timeParse("%Y")(d.year),
				value : d.coal_consumption,
				country: d.country
				// date: 2010,
				// value : 230
			}
		}).then((data) => {
			return data;
		});




		//We can draw the plot only after all of them have been loaded
		Promise.all([data_promise]).then((results) => {
			var energy_data = results[0];

			console.log('Data loaded')

			const to_exclude = ['Norway']
			// energy_data = energy_data.filter(x => x.renewables_consumption !=0 && !to_exclude.includes(x.country))
			energy_data = energy_data.filter(x => x.value !=0 && to_exclude.includes(x.country))
			const value_range = [0, d3.max(energy_data.map(d => parseFloat(d.renewables_consumption)))]



			//****** Heatmap legend ******
			// const width = 1200
			// const barWidth = 20
			// const height = 500
			// const margin = ({top: 20, right: 150, bottom: 30, left: 150})
			const margin = {top: 10, right: 30, bottom: 30, left: 50},
			width = 760 - margin.left - margin.right,
			height = 400 - margin.top - margin.bottom;

			const svg = d3.select("#"+element_id)
				.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
				.append("g")
					.attr("transform",
						  "translate(" + margin.left + "," + margin.top + ")");

			// Add X axis --> it is a date format
			const x_axis = d3.scaleTime()
						.domain(d3.extent(energy_data, d => d.date))
						.range([ 0, width]);

			svg.append("g")
			   .attr("transform", "translate(0,"+height+")")
			   .call(d3.axisBottom(x_axis).ticks(d3.timeYear.every(2)))
			   .selectAll("text")  
			   .style("text-anchor", "end")
			   .attr("dx", "-.3em")
			   .attr("dy", ".5em")
			   .attr("transform", "rotate(-35)");


			// Add Y axis
			const y_axis = d3.scaleLinear()
				.domain([0, d3.max(energy_data, d => +d.value)])
				.range([ height, 0 ]);

			svg.append("g")
				.call(d3.axisLeft(y_axis));

			// Add the area
			svg.append("path")
				.datum(energy_data)
				.attr("fill", "#cce5df")
				.attr("stroke", "#69b3a2")
				.attr("stroke-width", 1.5)
				.attr("d", d3.area()
					  .x(d => x_axis(d.date))
					  .y0(y_axis(0))
					  .y1(d => y_axis(d.value)));
		})
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
	plot_object = new BasicAreaChart('basic-area-chart');
});
