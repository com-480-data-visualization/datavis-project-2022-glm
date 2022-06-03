class MapPlot {

	constructor() {

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
			var energy_data = results[1];

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

			const to_exclude = ['World', 'Europe', 'Africa', 'North America']
			energy_data = energy_data.filter(x => x.renewables_consumption !=0 && !to_exclude.includes(x.country))
			const value_range = [0, d3.max(energy_data.map(d => parseFloat(d.renewables_consumption)))]

			//****** Heatmap legend ******
			const width = 1200
			const barWidth = 20
			const height = 500

			var svg = d3.select("#map-plot")
			.append("svg")
			.attr("width", width)
			.attr("height", height)

			//The <defs> element is used to store graphical objects that will be used at a later time.

			const defs = svg.append("defs");
			const linearGradient = defs.append("linearGradient")
																.attr('id', 'linear-gradient')
																.attr('x1', '0%')
																.attr('y1', '100%')
																.attr('x2', '0%')
																.attr('y2', '0%')

			const greens = [d3.color("#B7E4C7"), d3.color("#95D5B2"), d3.color("#74C69D"), d3.color("#52B788"),
			 								d3.color("#40916C"), d3.color("#2D6A4F"), d3.color("#1B4332")]
			const colorScale = d3.scaleSequential().interpolator(d3.interpolateRgbBasis(greens)).domain(value_range)

			const margin = ({top: 20, right: 150, bottom: 30, left: 150})
			svg.append('g')
			.attr("transform", "translate(" + (margin.left - barWidth) + "," + margin.top + ")")
			.append("rect")
			.attr("width", barWidth)
			.attr("height", height - margin.bottom - margin.top)
			.style("fill", "url(#linear-gradient)");

			linearGradient.selectAll("stop")
			.data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
			.enter().append("stop")
			.attr("offset", d => d.offset)
			.attr("stop-color", d => d.color);

			let axisScale = d3.scaleLinear()
			.domain(colorScale.domain())
			.range([height - margin.bottom - margin.top, 0])

			let axisLeft = g => g
			.attr("class", `x-axis`)
			.attr("transform", "translate(" + (margin.left - barWidth) + "," + margin.top + ")")
			.call(d3.axisLeft(axisScale))

			svg.append('g')
			.call(axisLeft);

			//****** Draw countries******
			var projection = d3.geoNaturalEarth1()
			.center([0, 0]) //geographical center
			.scale(180)
			.translate([width/2, height/2]) //center in SVG coordinate space

			const path = d3.geoPath(projection);

			// create a tooltip to display country name
	  	var tooltip = d3.select("#map-plot")
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

			const chart_width = 700;
			const chart_height = 100;
			var chart_margin = {left:50,right:50,top:50,bottom:40}

			//add a chart with country-wise details
			var mouseclick = function(d) {
				//remove previous chart if existing
				d3.select("#chart").remove()

				//only show a chart if data is available
				if (d.renew_cons !== "unavailable data"){

					var chart = d3.select("#map-plot")
						.append("div")
						.attr("id", "chart")
						.append("svg")
						.attr("width", chart_width + chart_margin.left + chart_margin.right)
						.attr("height", chart_height + chart_margin.top + chart_margin.bottom)

					var g = chart.append("g")
						.attr("transform","translate("+[chart_margin.left, chart_margin.top]+")");

					const selected_country_data = energy_data.filter(x => x.country == d.properties.name)
					const max_year = parseInt(d3.max(selected_country_data.map(x => x.year)))
					const max_year_population = selected_country_data.filter(x => x.year == max_year).map(x => parseInt(x.population))
					const max_year_gdp = selected_country_data.filter(x => x.year == max_year).map(x => parseInt(x.gdp) )

					//population icon
					chart.append('text')
							.text('\ue82b')
							.attr("x", chart_width/2 )
							.attr("y", 50)
							.attr("font-family", "Linearicons-Free")
							.attr("font-size", "20px")
							.attr("fill", "212529");

					//population number
					chart.append('text')
							.text(max_year_population[0].toLocaleString('en', {useGrouping:true}))
							.attr("x", chart_width/2 + 30)
							.attr("y", 50)
							.attr("font-size", "20px")
							.attr("font-family", "-apple-system")
							.attr("fill", "212529");

					const y_value_range = [0, d3.max(selected_country_data.map(d => parseFloat(d.renewables_consumption)))]
					const y = d3.scaleLinear()
								    .domain(y_value_range)
								    .range([chart_height, 0]);

					var yAxis = d3.axisLeft(y)
										    .ticks(5)
										    .scale(y);

					g.append("g").call(yAxis);

					const start_year = parseInt(d3.min(selected_country_data.map(x => x.year)))
					const end_year = parseInt(d3.max(selected_country_data.map(x => x.year)))

					var x = d3.scaleBand()
								    .domain(d3.range(start_year, end_year + 1))
								    .range([0, chart_width])
										.padding(0.3)

					var xAxis = d3.axisBottom()
						    				.scale(x)

					g.append("g")
			      .attr("transform", "translate(0," + chart_height + ")")
			      .call(xAxis)
						.selectAll("text")
						.attr("text-anchor","end")
		    		.attr("transform","rotate(-90)translate(-12,-15)")

					var rects = g.selectAll("rect")
									    .data(selected_country_data)
									    .enter()
									    .append("rect")
									    .attr("y", chart_height)
									    .attr("height",0)
									    .attr("width", x.bandwidth())
									    .attr("x", d => x(d.year))
									    .attr("fill","#2D6A4F")
									    .transition()
									    .attr("height", d => chart_height - y(d.renewables_consumption))
									    .attr("y", d => y(d.renewables_consumption))
									    .duration(1000);

						var title = chart.append("text")
					    .style("font-size", "20px")
							.attr("font-family", "-apple-system")
					    .text(d.properties.name)
					    .attr("x", chart_width/2 + chart_margin.left)
					    .attr("y", 30)
					    .attr("text-anchor","middle");

						var closeArea = chart.append('text')
																	.text('\ue880')
																	.attr("x", chart_width + 30)
																	.attr("y", 18)
																	.attr("font-family", "Linearicons-Free")
																	.attr("font-size", "20px")
																	.attr("fill", "212529");

						//remove the chart if you click on it
						closeArea.on("click", x => d3.select("#chart").remove())
					}
			}

			//draw the map with the first year unavailable
			const data_first_year_available = energy_data.filter(x => x.year === d3.min(energy_data.map(x => x.year)))
			const map_country_renew_cons = new Map();
			data_first_year_available.map(x => map_country_renew_cons.set(x.country, x.renewables_consumption))

			var countries = svg.selectAll("path")
				.data(map_data)
				.enter()
				.append("path")
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
				.on("click", mouseclick)

			//*** Time Slider ***//
			const slider_height = 80
			var slider_svg = d3.select("#slider")
												 .append("svg")
												 .attr("width", width)
												 .attr("height", slider_height)

			var slider = slider_svg.append("g")
									.attr("class", "slider")
									.attr("transform", "translate(" + margin.left + "," + (margin.top + 20) + ")");

			const start_date = new Date(parseInt(d3.min(energy_data.map(x => x.year))), 0, 1)
			const end_date = new Date(parseInt(d3.max(energy_data.map(x => x.year))), 0, 1)


			var date_into_year = d3.timeFormat("%Y");

			var x = d3.scaleTime()
					.domain([start_date, end_date])
					.range([0, width - margin.left - margin.right])
					.clamp(true);

			var timer = 0;
			var currentValue = 0;
			var playButton = d3.select("#play-button")

			slider.append("line")
				    .attr("class", "track")
				    .attr("x1", x.range()[0])
				    .attr("x2", x.range()[1])
				  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
				    .attr("class", "track-inset")
				  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
				    .attr("class", "track-overlay")
				    .call(d3.drag()
				        .on("start.interrupt", function() { slider.interrupt(); })
				        .on("start drag", function() {
				          currentValue = d3.event.x;
				          update(x.invert(currentValue));
				        })
				    );

			//add 10 years as labels for the slider
			slider.insert("g", ".track-overlay")
					  .attr("class", "ticks")
					  .attr("transform", "translate(0," + 18 + ")")
					.selectAll("text")
					  .data(x.ticks(10))
					  .enter()
					  .append("text")
					  .attr("x", x)
					  .attr("y", 10)
					  .attr("text-anchor", "middle")
					  .text(d => date_into_year(d));

			//circle slider
			var handle = slider.insert("circle", ".track-overlay")
				.attr("class", "handle")
				.attr("r", 9);

			//label with the year above the circle
			var label = slider.append("text")
										    .attr("class", "label")
										    .attr("text-anchor", "middle")
										    .text(date_into_year(start_date))
										    .attr("transform", "translate(0," + (-20) + ")")

			//This function is called by the play button
			playButton.on("click", function(){
				if(playButton.text() == "Play"){
					timer = setInterval(step, 100); //repeatedly calls step with a 100ms time delay between each call.
					playButton.text("Pause")
				}else{
					clearInterval(timer);
					playButton.text("Play")
				}
			})

			const max_value = (width - margin.left - margin.right)
			function step() {
			  update(x.invert(currentValue)); //reverse key,value and update the map
			  currentValue = currentValue + (max_value / 151);
			  if (currentValue > max_value) {
			    currentValue = 0;
			    clearInterval(timer);
			    playButton.text("Play");
			  }
			}

			//update the position of the circle and the label above it
			function update(year) {
			  // update position and text of label according to slider scale
			  handle.attr("cx", x(year));
			  label
			    .attr("x", x(year))
			    .text(date_into_year(year));

			  // filter data set and redraw plot
			  var newData = energy_data.filter(x => x.year == date_into_year(year))
				const country_renew_cons = new Map();
				newData.map(x => country_renew_cons.set(x.country, x.renewables_consumption))

				countries.style("fill", function (d) {
	        d.renew_cons = country_renew_cons.get(d.properties.name) || "unavailable data";
					if(d.renew_cons === "unavailable data") return "#ADB5BD"
	        return colorScale(d.renew_cons);});
			}
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
	plot_object = new MapPlot();
});
