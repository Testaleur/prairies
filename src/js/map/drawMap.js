import { deptToRegion } from "../config.js";
import { processData } from "./dataProcessing.js";
import { updateLegend } from "../components/legend.js";
import { createBackButton } from "../components/backButton.js";
import { createSidebar } from "../components/sidebar.js";
import { showRegions } from "./layers.js";
import { updateHistogram_Type } from "../components/histogram_type.js";
import { updateHistogram_Alti } from "../components/histogram_alti.js";

// Variables globales pour le filtrage
let allParcelles = []; 
let currentDataMap = new Map();

export function drawMap(svg, tooltip, width, height) {
  const BASE_URL = import.meta.env.BASE_URL;

  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.json(`${BASE_URL}departements.geojson`),
    d3.json(`${BASE_URL}arrondissements.geojson`),
    d3.csv(`${BASE_URL}parcelles.csv`)
  ]).then(([regionsData, deptsData, arrData, parcellesData]) => {
    
    allParcelles = parcellesData;
    window.allParcellesData = parcellesData;

    // --- Initialisation des sliders d'altitude ---
    const alts = parcellesData.map(p => +p.alt_mean).filter(a => !isNaN(a));
    const minPossible = Math.floor(d3.min(alts) || 0);
    const maxPossible = Math.ceil(d3.max(alts) || 3000);

    const minSlider = document.getElementById("alt-min-slider");
    const maxSlider = document.getElementById("alt-max-slider");

    minSlider.min = minPossible; minSlider.max = maxPossible; minSlider.value = minPossible;
    maxSlider.min = minPossible; maxSlider.max = maxPossible; maxSlider.value = maxPossible;

    document.getElementById("alt-min-display").innerText = minPossible;
    document.getElementById("alt-max-display").innerText = maxPossible;

    currentDataMap = processData(allParcelles, "ALL", minPossible, maxPossible);

    // --- Données carte ---
    const regionsNames = regionsData.features.map(f => f.properties.nom.trim());
    const maxValueRegions = d3.max(regionsNames, name => currentDataMap.get(name)?.count) || 100;
    const maxSurfaceRegions = d3.max(regionsNames, name => currentDataMap.get(name)?.surface) || 100;
    const selectedDisplay = document.getElementById("affichage-type-select").value;
    const selectedMax = selectedDisplay === "NB" ? maxValueRegions : maxSurfaceRegions;
    const label = selectedDisplay === "NB" ? "Nombre de prairies" : "Surface de prairies (ha)";

    // --- Éléments carte ---
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
    const initialScale = d3.scaleSequential().domain([0, selectedMax]).interpolator(d3.interpolateGreens);
    
    // --- Bouton, légende, sidebar ---
    const backButton = createBackButton(arrLayer, deptsLayer, deptsData, regionsLayer, deptToRegion, path, svg, zoom, regionsNames, currentDataMap, tooltip, arrData);
    updateLegend(svg, selectedMax, label);
    createSidebar(d3, allParcelles, regionsNames, currentDataMap, regionsLayer, deptsData, deptToRegion, svg, deptsLayer, arrData, arrLayer);

    // --- Histogrammes initiaux ---
    const counts = d3.rollup(parcellesData, v => v.length, d => d.CODE_CULTU);
    updateHistogram_Type(Array.from(counts, ([type, count]) => ({ type, count })), "France");
    updateHistogram_Alti(parcellesData, "France");
    
    // --- Dessin des régions ---
    showRegions(regionsLayer, regionsData, currentDataMap, svg, path, initialScale, tooltip, zoom, deptsData, deptsLayer, backButton, arrLayer, arrData, allParcelles);
  });
}