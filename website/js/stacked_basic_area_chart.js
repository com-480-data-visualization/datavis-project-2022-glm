class StackedBasicAreaChart {

	constructor(element_id) {

		d3.csv("./data/World_Energy_Consumption.csv",
		d => {
			return {
				year: d3.timeParse("%Y")(d.year),
				// year: parseInt(d.year),
				// values: [d.gas_consumption, d.coal_consumption, d.oil_consumption,d.solar_consumption,d.wind_consumption,d.hydro_consumption],
				gas: d.gas_consumption,
				coal: d.coal_consumption,
				oil: d.oil_consumption,
				solar: d.solar_consumption,
				wind: d.wind_consumption,
				hydro: d.hydro_consumption,
				country: d.country
			}
		}).then((data) => {

			var energy_data = data;


			console.log('Data loaded')
			const post_1965 = new Date('January 1, 1964 00:00:01');
			const pre_2020 = new Date('January 1, 2020 00:00:00');

			const to_include = ['World']
			// energy_data = energy_data.filter(x => x.value !=0 && to_include.includes(x.country))
			// energy_data = energy_data.filter(x => !x.values.includes("") && to_include.includes(x.country))
			energy_data = energy_data.filter(x => 
				x.year.getTime() < pre_2020.getTime() &&
				x.year.getTime() > post_1965.getTime() && 
				to_include.includes(x.country))


			// energy_data = energy_data.filter(x => 
			// 	x.year < 2020 &&
			// 	x.year > 1964 && 
			// 	to_include.includes(x.country))


			// // group the data: one array for each value of the X axis.
			// const grouped_on_year = d3.group(energy_data, d => d.year);



			// Stack the data: each group will be represented on top of each other
			// const energy_types = ["Gas", "Coal", "Oil", "Solar", "Wind", "Hydro"]
			// const energy_idx = Array(energy_types.length).fill().map((_, i) => i)
			// const stackedData = d3.stack()
			// 	.keys(energy_idx)
			// 	.value(function(d, key){
			// 		return d.values[key]})
			// 	(energy_data)

			const energy_keys = ["gas", "coal", "oil","solar","wind","hydro"]
			const order = d3.stackOrderDescending
			var stackGen = d3.stack()
				.keys(energy_keys)
				.order(order);

			var stackedData = stackGen(energy_data)
			// stackedData = stackedData.map(d => {
			// 	d.forEach(v => {
			// 	  v.key = d.key;
			// 	  v.data.name = v.data[groupBy];
			// 	});
			  
			// 	return d;
			//   })
			// console.log(stackedData[0].key)
			// console.log(stackedData[0][0].data)
			// console.log(stackedData)
			// console.log(energy_data)

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

			// Create X axis (date format)
			const x_axis = d3.scaleTime()
						.domain(d3.extent(energy_data, d => d.year))
						.range([ 0, width]);

			// Add X axis, rotate tick labels to fit more date ticks
			svg.append("g")
			   .attr("transform", "translate(0,"+height+")")
			   .call(d3.axisBottom(x_axis).ticks(d3.timeYear.every(3))) // tick every 2 years
			   .selectAll("text")  
			   .style("text-anchor", "end")
			   .attr("dx", "-.3em")
			   .attr("dy", ".5em")
			   .attr("transform", "rotate(-35)"); // rotate by 35 degrees

			// Create Y axis
			const y_axis = d3.scaleLinear()
				.domain(
					[0, d3.max( // take max over all entries (years) of sum of all energies
						energy_data, d => 
							parseInt(d.gas) + 
							parseInt(d.coal) + 
							parseInt(d.oil) +
							parseInt(d.solar) + 
							parseInt(d.wind) + 
							parseInt(d.hydro))])
				.range([ height, 0 ]);

			// Add Y axis
			svg.append("g")
				.call(d3.axisLeft(y_axis));

			// color palette
			const colorScale = d3.scaleOrdinal()
				.domain(energy_keys)
				.range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33'])
		  
			var areaGen = d3.area()
				.x((d) => x_axis(d.data.year))
				.y0((d) => y_axis(d[0]))
				.y1((d) => y_axis(d[1]));

			svg.selectAll("my-area")
				.data(stackedData)
				.enter()
				.append("path")
				.style("fill", (d) => colorScale(d.key))
				.attr("d", areaGen)

			
			// svg.append("path")
			// 	.datum(stackedData)
			// 	.attr("fill", (d) => colorScale(d.key))
			// 	.attr("d", areaGen)
				

			// Show the areas
			// svg.selectAll(".areas")
			// 	.data(stackedData)
			//     .enter()
			// 	.append("path")	
			// 		.style("fill", function(d) { return color(energy_types[d.key]); })
			// 		.attr("d", d3.area()
			// 		.x(function(d, i) { return x_axis(d.data.year); })
			// 		.y0(function(d) { return y_axis(d[0]); })
			// 		.y1(function(d) { return y_axis(d[1]); })
			// 	)

			// Show the areas
			// svg.append("path")
			// 	.datum(stackedData)
			// 	.style("fill", function(d) {return color(energy_types[d.key]); })
			// 	.attr("d", d3.area()
			// 		.x(function(d, i) { return x_axis(d.year); })
			// 		.y0(function(d) { return y_axis(d[0]); })
			// 		.y1(function(d) { return y_axis(d[1]); }))
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
	plot_object = new StackedBasicAreaChart('stacked-basic-area-chart');
});
