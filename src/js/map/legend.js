export function updateLegend(svg, maxValue, label) {
  svg.selectAll(".legend-group").remove();

  const legendG = svg.append("g")
    .attr("class", "legend-group")
    .attr("transform", `translate(25, 140)`);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.1, 0.1))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => d3.interpolateGreens(d));

  legendG.append("rect")
    .attr("width", 20)
    .attr("height", 150)
    .style("fill", "url(#linear-gradient)");

  const yScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([150, 0]);

  legendG.append("g")
    .attr("transform", `translate(20, 0)`)
    .call(d3.axisRight(yScale).ticks(5));

  legendG.append("text")
    .attr("y", -10)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(label);
}
