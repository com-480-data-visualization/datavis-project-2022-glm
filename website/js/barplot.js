class barPlot{

  constructor(element_id){

    const margin = {top: 30, right: 30, bottom: 70, left: 60},
          width = 1000 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    this.svg = d3.select("#" + element_id)
                 .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                 .append('g') //g element is used to group SVG shapes together
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Parse the Data
    d3.csv("./data/World_Energy_Consumption.csv").then((data) => {

      //filter Switzerland data and remove rows with empty values
      const swiss_data = data.filter(d => d.country == "Switzerland" && d.renewables_consumption != '')

      //X axis
      //Band scales are convenient for charts with an ordinal or categorical dimension.
      const pointX_to_svgX = d3.scaleBand()
        .range([0, width ])
        .domain(swiss_data.map(d => d.year))
        .padding(0.3); //padding between rectangles

      this.svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(pointX_to_svgX))
        .selectAll("text")
          .attr("transform", "translate(-5,0)rotate(-45)")
          .style("text-anchor", "end");

      //Y axis
      const y_value_range = [0, d3.max(swiss_data.map(d => parseFloat(d.renewables_consumption)))]
      const pointY_to_svgY = d3.scaleLinear()
        .domain(y_value_range)
        .range([height, 0]);

      this.svg.append("g")
        .call(d3.axisLeft(pointY_to_svgY));

      // Bars
      this.svg.selectAll("mybar")
        .data(swiss_data)
        .enter()
        .append("rect")
          .attr("x", d => pointX_to_svgX(d.year))
          .attr("y", d => pointY_to_svgY(parseFloat(d.renewables_consumption)))
          .attr("width", pointX_to_svgX.bandwidth())
          .attr("height", d => height - pointY_to_svgY(d.renewables_consumption))
          .attr("fill", "#000")
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
	plot_object = new barPlot('bar-plot');
});
