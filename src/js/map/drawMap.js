import { deptToRegion, regCodeToName, deptCodeToName, getCurrentRegionData } from "../config.js";
import { processData } from "./dataProcessing.js";
import { updateLegend } from "./legend.js";
import { clicked } from "./interactions.js";
import { createBackButton } from "../components/backButton.js";
import { createSidebar } from "../components/sidebar.js";

// Variables globales pour le filtrage
let allParcelles = []; 
let currentDataMap = new Map();

export function drawMap(svg, tooltip, width, height) {
  const BASE_URL = import.meta.env.BASE_URL;

  // get data
  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.json(`${BASE_URL}departements.geojson`),
    d3.json(`${BASE_URL}arrondissements.geojson`),
    d3.csv(`${BASE_URL}parcelles.csv`)
  ]).then(([regionsData, deptsData, arrData, parcellesData]) => {
    
    allParcelles = parcellesData;
    currentDataMap = processData(allParcelles, "ALL", regCodeToName, deptCodeToName);

    // global map data
    const regionsNames = regionsData.features.map(f => f.properties.nom.trim());
    const maxValueRegions = d3.max(regionsNames, name => currentDataMap.get(name)?.count) || 100;

    // initiate map elements
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
    const initialScale = d3.scaleSequential().domain([0, maxValueRegions]).interpolator(d3.interpolateGreens);
    
    // create button, legend, sidebar
    const backButton = createBackButton(arrLayer, deptsLayer, deptsData, regionsLayer, deptToRegion, path, svg, zoom, regionsNames, currentDataMap, tooltip, arrData);
    updateLegend(svg, maxValueRegions, "Valeur par Région");
    createSidebar(d3, allParcelles, regionsNames, currentDataMap, regionsLayer, deptsData, deptToRegion, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData);
    
    // start with drawing regions
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
        .on("click", (event, d) => {
          clicked(event, d, path, svg, zoom, regionsLayer, deptsData, deptToRegion, currentDataMap, tooltip, deptsLayer, backButton, arrLayer, arrData);
        });

  });
}