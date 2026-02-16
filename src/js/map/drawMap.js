import { deptToRegion, regCodeToName, deptCodeToName } from "../config.js";
import { processData } from "./dataProcessing.js";
import { updateLegend } from "./legend.js";

// Variables globales pour le filtrage
let allParcelles = []; 
let currentDataMap = new Map();

export function drawMap(svg, tooltip, width, height) {
  const BASE_URL = import.meta.env.BASE_URL;

  let currentRegionData = null;
  let currentDeptData = null;

  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.json(`${BASE_URL}departements.geojson`),
    d3.json(`${BASE_URL}arrondissements.geojson`),
    d3.csv(`${BASE_URL}parcelles.csv`)
  ]).then(([regionsData, deptsData, arrData, parcellesData]) => {
    
    allParcelles = parcellesData;
    currentDataMap = processData(allParcelles, "ALL", regCodeToName, deptCodeToName);

    const regionsNames = regionsData.features.map(f => f.properties.nom.trim());
    const maxValueRegions = d3.max(regionsNames, name => currentDataMap.get(name)?.count) || 100;

    const projection = d3.geoConicConformal()
      .center([2.2137, 46.2276])
      .scale(3000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");
    const arrLayer = g.append("g").attr("class", "arr-layer");
    const deptsLayer = g.append("g").attr("class", "depts-layer");
    const regionsLayer = g.append("g").attr("class", "regions-layer");

    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .on("zoom", (event) => g.attr("transform", event.transform));

    const backButton = d3.select("#map-container").append("button")
      .attr("id", "back-button")
      .text("← Retour à la France")
      .style("position", "absolute").style("top", "70px").style("left", "20px")
      .style("display", "none").style("z-index", "1000")
      .on("click", reset);

    function reset() {
      const currentText = backButton.text();
      if (currentText === "← Retour au Département") {
        backButton.text("← Retour à la Région");
        arrLayer.selectAll("path").transition().duration(500).style("opacity", 1);
        zoomToFeature(currentDeptData, 0.8);
      } else if (currentText === "← Retour à la Région") {
        backButton.text("← Retour à la France");
        arrLayer.selectAll("path").remove();
        showDepartments(currentRegionData.properties.nom);
        zoomToFeature(currentRegionData, 0.8);
      } else if (currentText === "← Retour à la France") {
        backButton.style("display", "none");
        arrLayer.selectAll("path").remove();
        deptsLayer.selectAll("path").remove();
        const maxVal = d3.max(regionsNames, n => currentDataMap.get(n)?.count) || 100;
        updateLegend(svg, maxVal, "Valeur par Région");
        regionsLayer.selectAll("path").transition().duration(500).style("opacity", 1).style("pointer-events", "all");
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        currentRegionData = null;
      }
    }

    function zoomToFeature(d, paddingFactor = 0.8) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(40, paddingFactor / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
    }

    function clicked(event, d) {
      currentRegionData = d;
      backButton.style("display", "block").text("← Retour à la France");
      if (event) event.stopPropagation();
      zoomToFeature(d, 0.7);
      showDepartments(d.properties.nom);
    }

    function zoomToDept(event, d) {
      event.stopPropagation();
      currentDeptData = d;
      backButton.text("← Retour à la Région");
      zoomToFeature(d, 0.8);
      showArrondissements(d.properties.code);
    }

    function showArrondissements(deptCode) {
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
        .on("click", (event, d) => zoomToArr(event, d))
        .transition().duration(500).style("opacity", 1);
    }

    function zoomToArr(event, d) {
      event.stopPropagation();
      backButton.text("← Retour au Département");
      zoomToFeature(d, 0.9);
      arrLayer.selectAll("path").transition().duration(750).style("opacity", node => node === d ? 1 : 0.1);
    }

    function showDepartments(regionName) {
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
        .on("click", (event, d) => zoomToDept(event, d))
        .transition().duration(500).style("opacity", 1);
    }

    const initialScale = d3.scaleSequential().domain([0, maxValueRegions]).interpolator(d3.interpolateGreens);
    updateLegend(svg, maxValueRegions, "Valeur par Région");

    regionsLayer.selectAll("path")
      .data(regionsData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("vector-effect", "non-scaling-stroke")
      .attr("fill", d => initialScale(currentDataMap.get(d.properties.nom.trim())?.count || 0))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        const name = d.properties.nom;
        const stats = currentDataMap.get(name.trim());
        tooltip.style("opacity", 1).html(`
            <strong>Région :</strong> ${name}<br/>
            <strong>Nombre :</strong> ${stats ? stats.count : 0}<br/>
            <strong>Altitude moy. :</strong> ${stats ? stats.avgAlt : 0} m
        `);
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1);
      })
      .on("click", clicked);

    // --- LOGIQUE SÉLECTEUR SIDEBAR ---
    d3.select("#prairie-type-select").on("change", function() {
      const val = this.value;
      currentDataMap = processData(allParcelles, val, regCodeToName, deptCodeToName);

      const newMax = d3.max(regionsNames, n => currentDataMap.get(n)?.count) || 1;
      const newScale = d3.scaleSequential().domain([0, newMax]).interpolator(d3.interpolateGreens);

      regionsLayer.selectAll("path")
        .transition().duration(500)
        .attr("fill", d => newScale(currentDataMap.get(d.properties.nom.trim())?.count || 0));

      updateLegend(svg, newMax, "Valeur par Région");

      if (currentRegionData) showDepartments(currentRegionData.properties.nom);
    });
  });
}