class treeMap{
  constructor(element_id){
    const margin = {top: 10, right: 10, bottom: 10, left: 10},
          width = 500 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    this.svg = d3.select("#" + element_id)
                 .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                 .append('g') //g element is used to group SVG shapes together
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv('./data/World_Energy_Consumption.csv', function(data) {
      const data_2014 = Array.from(data).filter(d => d.renewables_consumption != '' && data.year == 2014);

      var root = d3.stratify()
        .id(function(d) { return d.country; })   // Name of the entity (column name is name in csv)
        .parentId(function(d) { return d.year; })   // Name of the parent (column name is parent in csv)
        (data_2014);
      //var root = d3.hierarchy(data_2014).sum(function(d){ 
        //return d.renewables_consumption})

      d3.treemap()
        .size([width, height])
        .padding(4)
        (root);

      this.svg
        .selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
          .attr('x', function (d) { return d.x0; })
          .attr('y', function (d) { return d.y0; })
          .attr('width', function (d) { return d.x1 - d.x0; })
          .attr('height', function (d) { return d.y1 - d.y0; })
          .style("stroke", "black")
          .style("fill", "#69b3a2");

      this.svg
        .selectAll("text")
        .data(root.leaves())
        .enter()
        .append("text")
          .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
          .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
          .text(function(d){ return d.data.country})
          .attr("font-size", "15px")
          .attr("fill", "white");
  });
};
}

function whenDocumentLoaded(action) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", action);
  } else {
    // `DOMContentLoaded` already fired
    action();
  }
};

whenDocumentLoaded(() => {
  plot_object = new treeMap('treemap');
});