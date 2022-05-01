
class MapPlot {

	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);

		// may be useful for calculating scales
		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;



		const map_promise = d3.json("/data/countries.json").then((topojson_raw) => {
			const countries_paths = topojson.feature(topojson_raw, topojson_raw.objects.countries);
			return countries_paths.features;
		});


		//We can draw the plot only after all of them have been loaded
		Promise.all([map_promise]).then((results) => {
			let map_data = results[0];

			console.log('Data loaded')

			// Draw the cantons
			var projection = d3.geoNaturalEarth1()
												 .center([0, 0]) //geographical center
												 .scale( 210 )
												 .translate([this.svg_width/2, this.svg_height/2]) //center in SVG coordinate space
			const path = d3.geoPath(projection);

			this.svg.selectAll("path")
  			 .data(map_data)
  		 	 .enter().append("path")
    		 .attr("d", path);

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
