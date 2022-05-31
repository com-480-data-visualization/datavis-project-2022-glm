class MapPlot {

	constructor(div_element_id) {

		const map_promise = d3.json("./data/countries.json").then((topojson_raw) => {
			const countries_paths = topojson.feature(topojson_raw, topojson_raw.objects.countries);
			return countries_paths.features;
		});

		const data_promise = d3.csv("./data/World_Energy_Consumption.csv").then((data) => {
			return data;
		});


		//We can draw the plot only after all of them have been loaded
		Promise.all([map_promise, data_promise]).then((results) => {
			let map_data = results[0];
			let energy_data = results[1];

			//replace 'United States of America' in map_data
			//by 'United States' in order to match energy_data
			map_data.map(element => {
				if (element.properties.name === 'United States of America') {
					element.properties.name = 'United States'
    			return element;
  			}
  			return element;
			});

			console.log('Data loaded')

			const year = 2000
			const to_exclude = ['World', 'Europe', 'Africa', 'North America']
			let energy_data_2005 = energy_data.filter(x => x.year == year && x.renewables_consumption!=0 && !to_exclude.includes(x.country))
			const value_range = [0, d3.max(energy_data_2005.map(d => parseFloat(d.renewables_consumption)))]

			const map_country_renew_cons = new Map();
			energy_data_2005.map(x => map_country_renew_cons.set(x.country, x.renewables_consumption))


			//****** Heatmap legend ******
			const width = 1200
			const height = 600
			var svg = d3.select("#" + div_element_id)
			.append("svg")
			.attr("width", width)
			.attr("height", height)

			//The <defs> element is used to store graphical objects that will be used at a later time.
			const defs = svg.append("defs");
			const linearGradient = defs.append("linearGradient")
			.attr("id", "linear-gradient");

			const greens = [d3.color("#B7E4C7"), d3.color("#95D5B2"), d3.color("#74C69D"), d3.color("#52B788"),
			 								d3.color("#40916C"), d3.color("#2D6A4F"), d3.color("#1B4332")]
			const colorScale = d3.scaleSequential().interpolator(d3.interpolateRgbBasis(greens)).domain(value_range)

			const barHeight = 20
			const margin = ({top: 20, right: 150, bottom: 30, left: 150})
			svg.append('g')
			.attr("transform", `translate(0,${height - margin.bottom - barHeight})`)
			.append("rect")
			.attr('transform', `translate(${margin.left}, 0)`)
			.attr("width", width - margin.right - margin.left)
			.attr("height", barHeight)
			.style("fill", "url(#linear-gradient)");

			linearGradient.selectAll("stop")
			.data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
			.enter().append("stop")
			.attr("offset", d => d.offset)
			.attr("stop-color", d => d.color);

			let axisScale = d3.scaleLinear()
			.domain(colorScale.domain())
			.range([margin.left, width - margin.right])

			let axisBottom = g => g
			.attr("class", `x-axis`)
			.attr("transform", `translate(0,${height - margin.bottom})`)
			.call(d3.axisBottom(axisScale)
			.ticks(width/ 100)
			.tickSize(-barHeight))

			svg.append('g')
			.call(axisBottom);

			//****** Draw countries******

			var projection = d3.geoNaturalEarth1()
			.center([0, 0]) //geographical center
			.scale(175)
			.translate([width/2, height/2]) //center in SVG coordinate space

			const path = d3.geoPath(projection);

			// create a tooltip to display country name
	  	var tooltip = d3.select("#" + div_element_id)
				.append("div")
				.style("position", "absolute")
		    .style("visibility", "hidden")
				.style("background-color", "white")
		    .style("border", "solid")
		    .style("border-width", "2px")
		    .style("border-radius", "5px")
		    .style("padding", "5px")


			// Three functions that change the tooltip when user hover / move / leave a cell
			var mouseover = function(d) {
				tooltip
		      .style("visibility", "visible")
		    d3.select(this)
		      .style("stroke", "black")
		      .style("opacity", 1)
			}

			var mousemove = function(d) {
				var html = 0
		    if (d.renew_cons === "unavailable data") html = tooltip.html(d.properties.name + "<br>" + "unavailable data")
				else html = tooltip.html(d.properties.name + "<br>" + d.renew_cons + " TWh")

				return html.style("top", (event.pageY - 20)+"px").style("left",(event.pageX + 20)+"px")
		  }

			var mouseleave = function(d) {
				tooltip
					.style("visibility", "hidden")
				d3.select(this)
					.style("stroke", "none")
			}

			svg.selectAll("path")
			.data(map_data)
			.enter().append("path")
			// draw each country
			.attr("d", path)
			// set the color of each country
			.attr("fill", function (d) {
        d.renew_cons = map_country_renew_cons.get(d.properties.name) || "unavailable data";
				if(d.renew_cons === "unavailable data") return "#ADB5BD"
        return colorScale(d.renew_cons);})
			.on("mouseover", mouseover)
	    .on("mousemove", mousemove)
	    .on("mouseleave", mouseleave)

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
	plot_object = new MapPlot('map-plot');
});
