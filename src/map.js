export function drawMap(svg, tooltip, width, height, geoData, data) {
  // Convert CSV to Map using region names
  const dataMap = new Map(data.map(d => [d.nom.trim(), +d.value]));

  // Color scale
  const maxValue = d3.max(data, d => +d.value);
  const colorScale = d3.scaleSequential()
    .domain([0, maxValue])
    .interpolator(d3.interpolateBlues);

  // Projection (France)
  const projection = d3.geoConicConformal()
    .center([2.2137, 46.2276])
    .scale(2500)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Draw map
  svg.selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const name = d.properties.nom.trim();
      const value = dataMap.get(name);
      return value ? colorScale(value) : "#ddd";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      const name = d.properties.nom.trim();
      const value = dataMap.get(name) || "No data";
      d3.select(event.currentTarget).attr("stroke-width", 2);
      tooltip.style("opacity", 1)
        .html(`<strong>${name}</strong><br/>Value: ${value}`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", event => {
      d3.select(event.currentTarget).attr("stroke-width", 0.5);
      tooltip.style("opacity", 0);
    });
}
