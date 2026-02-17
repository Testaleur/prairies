import { updateLegend } from "./legend";
import { zoomToDept} from "./interactions";

export function showDepartments(regionName, regionsLayer, deptsData, deptToRegion, currentDataMap, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData) {
  console.log("showing departments for region:", regionName);
  console.log(regionsLayer, deptsData, deptToRegion, currentDataMap, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData);
  regionsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");
  const filteredDepts = deptsData.features.filter(f => deptToRegion[f.properties.code] === regionName);
  const localMax = d3.max(filteredDepts, f => currentDataMap.get(f.properties.nom.trim())?.count) || 1;
  const localScale = d3.scaleSequential().domain([0, localMax]).interpolator(d3.interpolateGreens);
  updateLegend(svg, localMax, "Valeur par Dept");

  const depts = deptsLayer.selectAll("path").data(filteredDepts, d => d.properties.nom);
  depts.enter()
    .append("path")
    .attr("d", path)
    .style("vector-effect", "non-scaling-stroke")
    .attr("fill", d => localScale(currentDataMap.get(d.properties.nom.trim())?.count || 0))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      const name = d.properties.nom;
      const stats = currentDataMap.get(name.trim());
      tooltip.style("opacity", 1).html(`
        <div style="font-weight:bold; font-size:15px;">${name}</div>
        <hr>
        <div><strong>Nombre :</strong> ${stats ? stats.count : 0}</div>
        <div><strong>Altitude :</strong> ${stats ? stats.avgAlt : 0} m</div>
      `);
      d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY + 15) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 0.5);
    })
    .on("click", (event, d) => {
      zoomToDept(event, d, backButton, path, svg, zoom, arrLayer, arrData, currentDataMap, tooltip, deptsLayer);
    })
    .transition().duration(500).style("opacity", 1);
}

export function showArrondissements(deptCode, backButton, deptsLayer, arrLayer, arrData, currentDataMap, svg, path, tooltip) {
  console.log("showing arrondissements for dept:", deptCode);
  deptsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");
  const filteredArr = arrData.features.filter(f => f.properties.code.startsWith(deptCode));
  const localMax = d3.max(filteredArr, f => currentDataMap.get(f.properties.nom.trim())?.count) || 1;
  const localScale = d3.scaleSequential().domain([0, localMax]).interpolator(d3.interpolateGreens);
  updateLegend(svg, localMax, "Valeur par Arrond.");

  const arr = arrLayer.selectAll("path").data(filteredArr, d => d.properties.nom);
  arr.enter()
    .append("path")
    .attr("d", path)
    .style("vector-effect", "non-scaling-stroke")
    .attr("fill", d => localScale(currentDataMap.get(d.properties.nom.trim())?.count || 0))
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5)
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      const name = d.properties.nom;
      const stats = currentDataMap.get(name.trim());
      tooltip.style("opacity", 1).html(`
        <div style="font-weight:bold; font-size:15px;">${name}</div>
        <hr>
        <div><strong>Nombre :</strong> ${stats ? stats.count : 0}</div>
        <div><strong>Altitude :</strong> ${stats ? stats.avgAlt : 0} m</div>
      `);
      d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY + 15) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).attr("stroke", "#999").attr("stroke-width", 0.5);
    })
    .on("click", (event, d) => zoomToArr(event, d, backButton))
    .transition().duration(500).style("opacity", 1);
}