class MapPlot {

	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);

		// may be useful for calculating scales
		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;


		const map_promise = d3.json("./data/countries.json").then((topojson_raw) => {
			const countries_paths = topojson.feature(topojson_raw, topojson_raw.objects.countries);
			return countries_paths.features;
		});

		const data_promise = d3.csv("./data/World_Energy_Consumption.csv").then((data) => {
			// process the energy data here
			//console.log(data)
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

			//The <defs> element is used to store graphical objects that will be used at a later time.
			const defs = this.svg.append("defs");
			const linearGradient = defs.append("linearGradient")
			.attr("id", "linear-gradient");

			const greens = [d3.color("#B7E4C7"), d3.color("#95D5B2"), d3.color("#74C69D"), d3.color("#52B788"),
			 								d3.color("#40916C"), d3.color("#2D6A4F"), d3.color("#1B4332")]
			const colorScale = d3.scaleSequential().interpolator(d3.interpolateRgbBasis(greens)).domain(value_range)
			const margin = ({top: 20, right: 150, bottom: 30, left: 150})
			const barHeight = 20

			this.svg.append('g')
			.attr("transform", `translate(0,${this.svg_height - margin.bottom - barHeight})`)
			.append("rect")
			.attr('transform', `translate(${margin.left}, 0)`)
			.attr("width", this.svg_width - margin.right - margin.left)
			.attr("height", barHeight)
			.style("fill", "url(#linear-gradient)");

			linearGradient.selectAll("stop")
			.data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
			.enter().append("stop")
			.attr("offset", d => d.offset)
			.attr("stop-color", d => d.color);

			let axisScale = d3.scaleLinear()
			.domain(colorScale.domain())
			.range([margin.left, this.svg_width - margin.right])

			let axisBottom = g => g
			.attr("class", `x-axis`)
			.attr("transform", `translate(0,${this.svg_height - margin.bottom})`)
			.call(d3.axisBottom(axisScale)
			.ticks(this.svg_width / 100)
			.tickSize(-barHeight))

			this.svg.append('g')
			.call(axisBottom);


			//****** Draw countries******
			var projection = d3.geoNaturalEarth1()
			.center([0, 0]) //geographical center
			.scale(175)
			.translate([this.svg_width/2, this.svg_height/2]) //center in SVG coordinate space

			//map_data.features = map_data.features.filter(function(d){console.log(d.properties.name) ; return d.properties.name=="France"})

			//map_data.map(x => console.log(x))

			const path = d3.geoPath(projection);

			const in_map_not_in_energy = map_data.filter(value => ! energy_data_2005.map(x => x.country).includes(value.properties.name));
			const in_energy_not_in_map = energy_data_2005.filter(value => ! map_data.map(x => x.properties.name).includes(value.country))
			//in_energy_not_in_map.map(x => console.log(x.country))

			//in_map_not_in_energy.map(x => console.log(x.properties.name))

			this.svg.selectAll("path")
			.data(map_data)
			.enter().append("path")
			// draw each country
			.attr("d", path)

			// set the color of each country
			.attr("fill", function (d) {
        d.renew_cons = map_country_renew_cons.get(d.properties.name) || "unavailable_data";
				if(d.renew_cons === "unavailable_data") return "#ADB5BD"
        return colorScale(d.renew_cons);});
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
