import * as d3 from "d3";

export function drawMap(svg, tooltip, width, height) {
  Promise.all([
    d3.json("/regions.geojson"),
    d3.csv("/data.csv"),
  ])
    .then(([geoData, data]) => {
      // Map CSV values by region code
      const dataMap = new Map(data.map(d => [d.id, +d.value]));

      // Color scale
      const maxValue = d3.max(data, d => +d.value);
      const colorScale = d3.scaleSequential()
        .domain([0, maxValue])
        .interpolator(d3.interpolateBlues);

      // Projection for France
      const projection = d3.geoConicConformal()
        .center([2.2137, 46.2276])
        .scale(3500)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      // Draw regions
      svg.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const value = dataMap.get(d.properties.code);
          return value ? colorScale(value) : "#ddd";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
          const value = dataMap.get(d.properties.code) || "No data";
          d3.select(event.currentTarget).attr("stroke-width", 2);
          tooltip
            .style("opacity", 1)
            .html(`<strong>${d.properties.nom}</strong><br/>Value: ${value}`);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).attr("stroke-width", 0.5);
          tooltip.style("opacity", 0);
        });
    })
    .catch(err => console.error("Error loading map/data:", err));
}
