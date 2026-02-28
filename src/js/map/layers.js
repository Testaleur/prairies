import { updateLegend } from "../components/legend.js";
import { zoomToDept, zoomToArr } from "./interactions";
import { clicked } from "./interactions";
import { deptToRegion, strokeColor, strokeWidth } from "../config.js";
import { getCurrentDataMap } from "../components/sidebar.js";
import { labelsTraduction } from "../components/histogram_type.js";

// gestion de l'affichage des différentes couches de la carte : régions, départements, arrondissements

// Afficher les régions
// Ajoute allParcelles à la fin de la liste des paramètres
export function showRegions(regionsLayer, regionsData, currentDataMap, svg, path, initialScale, tooltip, zoom, deptsData, deptsLayer, backButton, arrLayer, arrData, allParcelles, zoomControls) {
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
      const stats = getCurrentDataMap().get(name.trim());
      const typeName = getSelectedTypeName();
      tooltip.style("opacity", 1).html(`
        <strong>Région :</strong> ${name}<br/>
        <strong>Nombre de ${typeName} :</strong> ${stats ? format(stats.count) : 0}<br/>
        <strong>Surface de ${typeName} :</strong> ${stats ? format(stats.surface) : 0} ha<br/>
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
      .on("click", (event, d) => clicked(event,
        d,
        path,
        svg,
        zoom,
        regionsLayer,
        deptsData,
        deptToRegion,
        currentDataMap,
        tooltip,
        deptsLayer,
        backButton,
        arrLayer,
        arrData,
        allParcelles,
        zoomControls
      ));

      const mapContainer = d3.select("#map-container");

      
      if (mapContainer.select(".scroll-indicator").empty()) {
        const indicator = mapContainer.append("div")
        .attr("class", "scroll-indicator")
        .style("position", "absolute")
        .style("bottom", "20px")
        .style("left", "20px")
        .style("cursor", "pointer")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("color", "#000000") 
        .style("font-weight", "bold")
        .style("z-index", "1000")
        .on("click", () => {
          
        const histoSection = document.getElementById("histogram-section");
        if (histoSection) {
          histoSection.scrollIntoView({ behavior: "smooth" });
      }
    });

      indicator.append("span")
      .text("Graphiques")
      .style("font-size", "14px");

      indicator.append("span")
      .text("↓")
      .style("font-size", "20px")
      .style("margin-top", "-5px");
    
      
      indicator.style("transition", "transform 0.3s ease-in-out");
      setInterval(() => {
        indicator.transition()
       .duration(500)
       .style("transform", "translateY(5px)")
       .transition()
       .duration(500)
       .style("transform", "translateY(0px)");
      }, 2000);
}
}

// Afficher les départements d'une région
export function showDepartments(regionName, regionsLayer, deptsData, deptToRegion, currentDataMap, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData, zoomControls) {
  regionsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");
  const filteredDepts = deptsData.features.filter(f => deptToRegion[f.properties.code] === regionName);
  const liveMap = getCurrentDataMap();
  const localMax = d3.max(filteredDepts, f => liveMap.get(f.properties.nom.trim())?.count) || 1;
  const localMaxSurface = d3.max(filteredDepts, f => liveMap.get(f.properties.nom.trim())?.surface) || 1;
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
    .attr("fill", d => localScale(liveMap.get(d.properties.nom.trim())?.[propertyToUse] || 0))
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      const name = d.properties.nom;
      const stats = getCurrentDataMap().get(name.trim());
      const typeName = getSelectedTypeName();
      tooltip.style("opacity", 1).html(`
        <div style="font-weight:bold; font-size:15px;">${name}</div>
        <hr>
        <div><strong>Nombre de ${typeName} :</strong> ${stats ? stats.count : 0}</div>
        <strong>Surface de ${typeName} :</strong> ${stats ? stats.surface : 0} ha<br/>
        <div><strong>Altitude moy. :</strong> ${stats ? stats.avgAlt : 0} m</div>
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
      zoomToDept(event, d, backButton, path, svg, zoom, arrLayer, arrData, currentDataMap, tooltip, deptsLayer, zoomControls);
    })
    .transition().duration(500).style("opacity", 1);
}

// Afficher les arrondissements d'un département
export function showArrondissements(deptCode, backButton, deptsLayer, arrLayer, arrData, currentDataMap, svg, path, tooltip, zoom, zoomControls) {
  deptsLayer.selectAll("path")
    .transition().duration(500)
    .style("opacity", 0)
    .style("pointer-events", "none");

  const filteredArr = arrData.features.filter(f => f.properties.code.startsWith(deptCode));
  const liveMap = getCurrentDataMap();

  const localMax = d3.max(filteredArr, f => liveMap.get(f.properties.code)?.count) || 1;
  const localMaxSurface = d3.max(filteredArr, f => liveMap.get(f.properties.code)?.surface) || 1;

  const selectedDisplay = document.getElementById("affichage-type-select").value;
  const selectedMax = selectedDisplay === "NB" ? localMax : localMaxSurface;
  const label = selectedDisplay === "NB" ? "Nombre de prairies" : "Surface de prairies (ha)";
  const propertyToUse = selectedDisplay === "NB" ? "count" : "surface";

  const localScale = d3.scaleSequential()
    .domain([0, selectedMax])
    .interpolator(d3.interpolateGreens);

  updateLegend(svg, selectedMax, label);

  const arr = arrLayer.selectAll("path")
    .data(filteredArr, d => d.properties.code);

  arr.enter()
    .append("path")
    .attr("d", path)
    .style("vector-effect", "non-scaling-stroke")
    .attr("fill", d => localScale(liveMap.get(d.properties.code)?.[propertyToUse] || 0))
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      if(!isShowPrairiesChecked()){
        const code = d.properties.code;
        const stats = currentDataMap.get(code);
        const typeName = getSelectedTypeName();
        tooltip.style("opacity", 1).html(`
          <div style="font-weight:bold; font-size:15px;">${code}</div>
          <hr>
          <div><strong>Nombre de ${typeName}:</strong> ${stats ? stats.count : 0}</div>
          <div><strong>Surface de ${typeName} :</strong> ${stats ? stats.surface : 0} ha</div>
          <div><strong>Altitude :</strong> ${stats ? stats.avgAlt : 0} m</div>
        `);
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
      }
    })
    .on("mousemove", (event) => {
      if(!isShowPrairiesChecked()){
      tooltip.style("left", (event.pageX + 15) + "px")
             .style("top", (event.pageY + 15) + "px");
      }
    })
    .on("mouseout", (event) => {
      if(!isShowPrairiesChecked()){
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget).attr("stroke", strokeColor).attr("stroke-width", strokeWidth);
      }
    })
    .on("click", (event, d) => {
      if(!isShowPrairiesChecked()) {
        zoomToArr(event, d, backButton, path, svg, zoom, arrLayer, zoomControls);
        // reset the color to white
        d3.select(event.currentTarget).attr("fill", "#fff");
      }
    })
    .transition().duration(500)
    .style("opacity", 1);
}

function isShowPrairiesChecked() {
  return document.getElementById("check-prairies").checked;
}

function getSelectedTypeName() {
  const code = document.getElementById("prairie-type-select").value;
  return code === "ALL" ? "prairies" : (labelsTraduction[code] || code);
}