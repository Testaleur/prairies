import { updateLegend } from "../components/legend.js";
import { zoomToDept} from "./interactions";
import { clicked } from "./interactions";
import { deptToRegion, strokeColor, strokeWidth } from "../config.js";

// gestion de l'affichage des différentes couches de la carte : régions, départements, arrondissements

// Afficher les régions
export function showRegions(regionsLayer, regionsData, currentDataMap, svg, path, initialScale, tooltip, zoom, deptsData, deptsLayer, backButton, arrLayer, arrData) {
  const propertyToUse = document.getElementById("affichage-type-select").value === "NB" ? "count" : "surface";
  const format = d3.formatLocale({
    decimal: ",",
    thousands: " ",
    grouping: [3],
    currency: ["", " €"]
  }).format(",");

  regionsLayer.selectAll("path")
    .data(regionsData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("vector-effect", "non-scaling-stroke")
    .attr("fill", d => initialScale(currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0))
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .on("mouseover", (event, d) => {
      const name = d.properties.nom;
      const stats = currentDataMap.get(name.trim());
      tooltip.style("opacity", 1).html(`
        <strong>Région :</strong> ${name}<br/>
        <strong>Nombre :</strong> ${stats ? format(stats.count) : 0}<br/>
        <strong>Surface de prairies :</strong> ${stats ? format(stats.surface) : 0} ha<br/>
        <strong>Altitude moy. :</strong> ${stats ? stats.avgAlt : 0} m
        `);
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget).attr("stroke", strokeColor).attr("stroke-width", strokeWidth);
      })
      .on("click", (event, d) => {
        clicked(event, d, path, svg, zoom, regionsLayer, deptsData, deptToRegion, currentDataMap, tooltip, deptsLayer, backButton, arrLayer, arrData);
      });
}

// Afficher les départements d'une région
export function showDepartments(regionName, regionsLayer, deptsData, deptToRegion, currentDataMap, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData) {
  regionsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");
  const filteredDepts = deptsData.features.filter(f => deptToRegion[f.properties.code] === regionName);
  const localMax = d3.max(filteredDepts, f => currentDataMap.get(f.properties.nom.trim())?.count) || 1;
  const localMaxSurface = d3.max(filteredDepts, f => currentDataMap.get(f.properties.nom.trim())?.surface) || 1;
  const selectedDisplay = document.getElementById("affichage-type-select").value;
  const selectedMax = selectedDisplay === "NB" ? localMax : localMaxSurface;
  const label = selectedDisplay === "NB" ? "Nombre de prairies" : "Surface de prairies (ha)";
  const propertyToUse = selectedDisplay === "NB" ? "count" : "surface";
  const localScale = d3.scaleSequential().domain([0, selectedMax]).interpolator(d3.interpolateGreens);
  updateLegend(svg, selectedMax, label);

  const depts = deptsLayer.selectAll("path").data(filteredDepts, d => d.properties.nom);
  const paths = depts.join("path")
    .attr("d", path)
    .style("vector-effect", "non-scaling-stroke")
    .style("pointer-events", "all")
    .attr("fill", d => {
      return localScale(currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0);
    })
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      const name = d.properties.nom;
      const stats = currentDataMap.get(name.trim());
      tooltip.style("opacity", 1).html(`
        <div style="font-weight:bold; font-size:15px;">${name}</div>
        <hr>
        <div><strong>Nombre :</strong> ${stats ? stats.count : 0}</div>
        <strong>Surface de prairies :</strong> ${stats ? stats.surface : 0} ha<br/>
        <div><strong>Altitude :</strong> ${stats ? stats.avgAlt : 0} m</div>
      `);
      d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY + 15) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).attr("stroke", strokeColor).attr("stroke-width", strokeWidth);
    })
    .on("click", (event, d) => {
      zoomToDept(event, d, backButton, path, svg, zoom, arrLayer, arrData, currentDataMap, tooltip, deptsLayer);
    })
    .transition().duration(500).style("opacity", 1);
}

// Afficher les arrondissements d'un département
export function showArrondissements(deptCode, backButton, deptsLayer, arrLayer, arrData, currentDataMap, svg, path, tooltip) {
  console.log("Affichage des arrondissements pour le département", deptCode);

  deptsLayer.selectAll("path")
    .transition().duration(500)
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Filter arrondissements by department
  const filteredArr = arrData.features.filter(f => f.properties.code.startsWith(deptCode));

  const localMax = d3.max(filteredArr, f => currentDataMap.get(f.properties.code)?.count) || 1;
  const localMaxSurface = d3.max(filteredArr, f => currentDataMap.get(f.properties.code)?.surface) || 1;

  const selectedDisplay = document.getElementById("affichage-type-select").value;
  const selectedMax = selectedDisplay === "NB" ? localMax : localMaxSurface;
  const label = selectedDisplay === "NB" ? "Nombre de prairies" : "Surface de prairies (ha)";
  const propertyToUse = selectedDisplay === "NB" ? "count" : "surface";

  const localScale = d3.scaleSequential()
    .domain([0, selectedMax])
    .interpolator(d3.interpolateGreens);

  updateLegend(svg, selectedMax, label);

  const arr = arrLayer.selectAll("path")
    .data(filteredArr, d => d.properties.code); // key = arrCode

  arr.enter()
    .append("path")
    .attr("d", path)
    .style("vector-effect", "non-scaling-stroke")
    .attr("fill", d => {
      const stats = currentDataMap.get(d.properties.code);
      return localScale(stats ? stats[propertyToUse] : 0);
    })
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      const code = d.properties.code;  // Use code directly
      const stats = currentDataMap.get(code);
      tooltip.style("opacity", 1).html(`
        <div style="font-weight:bold; font-size:15px;">${code}</div>
        <hr>
        <div><strong>Nombre :</strong> ${stats ? stats.count : 0}</div>
        <div><strong>Surface de prairies :</strong> ${stats ? stats.surface : 0} ha</div>
        <div><strong>Altitude :</strong> ${stats ? stats.avgAlt : 0} m</div>
      `);
      d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 15) + "px")
             .style("top", (event.pageY + 15) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).attr("stroke", strokeColor).attr("stroke-width", strokeWidth);
    })
    .on("click", (event, d) => zoomToArr(event, d, backButton))
    .transition().duration(500)
    .style("opacity", 1);
}
