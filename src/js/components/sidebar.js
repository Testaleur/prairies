import { getCurrentRegionData, getCurrentView, getCurrentDeptData, getCurrentArrData } from "../config";
import { processData } from "../map/dataProcessing.js";
import { updateLegend } from "./legend.js";
import { afficherPrairies } from "../map/prairies.js";
import { updateHistogram_Type } from "./histogram_type.js";
import { updateHistogram_Alti } from "./histogram_alti.js";
import { updateHistogram_Surf } from "./histogram_surf.js";

// Référence partagée à la dataMap courante, lisible depuis layers.js
let _currentDataMap = new Map();
export function getCurrentDataMap() { return _currentDataMap; }
export function initCurrentDataMap(map) { _currentDataMap = map; }

export function createSidebar(
  d3,
  allParcelles,
  regionsNames,
  currentDataMap,
  regionsLayer,
  deptsData,
  deptToRegion,
  svg,
  deptsLayer,
  arrData,
  arrLayer,
  path
) {

  // Initialiser la dataMap partagée avec les données initiales
  _currentDataMap = currentDataMap;
  function getAltRange() {
    const minVal = +document.getElementById("alt-min-slider").value;
    const maxVal = +document.getElementById("alt-max-slider").value;
    return [minVal, maxVal];
  }

  function updateVisualization() {
    const prairieType = document.getElementById("prairie-type-select").value;
    const selectedDisplay = document.getElementById("affichage-type-select").value;
    const [altMin, altMax] = getAltRange();

    currentDataMap = processData(allParcelles, prairieType, altMin, altMax);
    _currentDataMap = currentDataMap;

    const propertyToUse = selectedDisplay === "NB" ? "count" : "surface";

    const newMaxRegion =
      d3.max(regionsNames, n => currentDataMap.get(n)?.[propertyToUse]) || 1;

    const regionScale = d3.scaleSequential()
      .domain([0, newMaxRegion])
      .interpolator(d3.interpolateGreens);

    const label =
      selectedDisplay === "NB"
        ? "Nombre de prairies"
        : "Surface de prairies (ha)";

    const currentView = getCurrentView();
    const currentRegionData = getCurrentRegionData();

    if (currentRegionData) {
      const regionName = currentRegionData.properties.nom;
      const filteredDepts = deptsData.features.filter(
        f => deptToRegion[f.properties.code] === regionName
      );
      var newMaxDep =
        d3.max(filteredDepts, f => currentDataMap.get(f.properties.nom.trim())?.[propertyToUse]) || 1;
      var depScale = d3.scaleSequential()
        .domain([0, newMaxDep])
        .interpolator(d3.interpolateGreens);
    }

    const currentDeptData = getCurrentDeptData();
    if (currentDeptData) {
      const filteredArr = arrData.features.filter(f => {
        const arrCode = f.properties.code;
        const depCode = arrCode.slice(0, 2);
        return depCode === currentDeptData.properties.code;
      });

      var newMaxArr =
        d3.max(
          filteredArr,
          f => currentDataMap.get(f.properties.code)?.[propertyToUse]
        ) || 1;

      var arrScale = d3.scaleSequential()
        .domain([0, newMaxArr])
        .interpolator(d3.interpolateGreens);
    }

    // --- Mise à jour carte ---
    if (currentView === "REGION") {
      updateLegend(svg, newMaxDep, label);
      updateDeptLayer(deptsLayer, currentDataMap, depScale, propertyToUse);
      updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse);
    } else if (currentView === "DEPARTEMENT") {
      updateLegend(svg, newMaxArr, label);
      updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse);
      updateDeptLayer(deptsLayer, currentDataMap, depScale, propertyToUse);
      updateArrLayer(arrLayer, currentDataMap, arrScale, propertyToUse);
    } else {
      // FRANCE
      updateLegend(svg, newMaxRegion, label);
      updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse);
    }

    // --- Mise à jour histogramme selon la vue courante ---
    if (!window.allParcellesData) return;

    const filtered = window.allParcellesData.filter(p => {
      const alt = +p.alt_mean;
      return !isNaN(alt) && alt >= altMin && alt <= altMax;
    });

    let parcellesToCount = filtered;
    let zoneName = "France";

    if (currentView === "REGION" && currentRegionData) {
      const regionCode = String(currentRegionData.properties.code);
      parcellesToCount = filtered.filter(p => String(p.reg_parc).split('.')[0] === regionCode);
      zoneName = currentRegionData.properties.nom;
    } else if ((currentView === "DEPARTEMENT" || currentView === "ARRONDISSEMENT") && currentDeptData) {
      const deptCode = String(parseInt(currentDeptData.properties.code));
      parcellesToCount = filtered.filter(p => String(parseInt(p.dep_parc)) === deptCode);
      zoneName = currentDeptData.properties.nom;
    }

    // Filtre par type de prairie si nécessaire
    const finalParcelles = prairieType === "ALL"
      ? parcellesToCount
      : parcellesToCount.filter(p => p.CODE_CULTU === prairieType);

    const counts = d3.rollup(finalParcelles, v => v.length, d => d.CODE_CULTU);
    updateHistogram_Type(Array.from(counts, ([type, count]) => ({ type, count })), zoneName);
    updateHistogram_Alti(finalParcelles, zoneName);
    updateHistogram_Surf(finalParcelles, zoneName);
  }

  // --- Écouteurs sur les selects ---
  d3.select("#prairie-type-select").on("change", updateVisualization);
  d3.select("#affichage-type-select").on("change", updateVisualization);

  // --- Écouteurs sur les sliders d'altitude ---
  const minSlider = d3.select("#alt-min-slider");
  const maxSlider = d3.select("#alt-max-slider");

  minSlider.on("input", function () {
    let valMin = +this.value;
    let valMax = +maxSlider.property("value");
    if (valMin > valMax) { valMin = valMax; this.value = valMin; }
    document.getElementById("alt-min-display").innerText = valMin;
    updateSliderColor();
    updateVisualization();
  });

  maxSlider.on("input", function () {
    let valMax = +this.value;
    let valMin = +minSlider.property("value");
    if (valMax < valMin) { valMax = valMin; this.value = valMax; }
    document.getElementById("alt-max-display").innerText = valMax;
    updateSliderColor();
    updateVisualization();
  });

  // Coloration initiale de la barre
  updateSliderColor();

  // boutons de filtre
  addCheckboxListeners(svg, allParcelles, path, arrLayer);
  // désactivés tant que l'on n'est pas dans un arrondissement
  disableButtons();
}

// --- Couches carte ---
function updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse) {
  regionsLayer.selectAll("path")
    .transition().duration(500)
    .attr("fill", d =>
      regionScale(currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0)
    );
}

function updateDeptLayer(deptsLayer, currentDataMap, depScale, propertyToUse) {
  deptsLayer.selectAll("path")
    .transition().duration(500)
    .attr("fill", d =>
      depScale(currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0)
    );
}

function updateArrLayer(arrLayer, currentDataMap, arrScale, propertyToUse) {
  arrLayer.selectAll("path")
    .transition().duration(500)
    .attr("fill", d =>
      arrScale(currentDataMap.get(d.properties.code)?.[propertyToUse] || 0)
    );
}

// --- Coloration de la barre du slider ---
export function updateSliderColor() {
  const minSlider = document.getElementById("alt-min-slider");
  const maxSlider = document.getElementById("alt-max-slider");
  const track = document.querySelector(".slider-track");
  if (!minSlider || !maxSlider || !track) return;

  const min = parseFloat(minSlider.min);
  const max = parseFloat(minSlider.max);
  const percent1 = ((minSlider.value - min) / (max - min)) * 100;
  const percent2 = ((maxSlider.value - min) / (max - min)) * 100;

  track.style.background = `linear-gradient(to right,
    #ddd ${percent1}%,
    #27ae60 ${percent1}%,
    #27ae60 ${percent2}%,
    #ddd ${percent2}%
  )`;
}


// option des boutons de filtre
export function enableButtons() {
  d3.select("#checkbox-group").selectAll("input[type='checkbox']").attr("disabled", null);
}

export function disableButtons() {
  d3.select("#checkbox-group")
    .selectAll("input[type='checkbox']")
    .property("checked", false)
    .attr("disabled", "disabled");
}

export function addCheckboxListeners(svg, allParcelles, path, arrLayer) {
  document.getElementById("check-prairies").addEventListener("change", function() {
  if (this.checked) {
      afficherPrairies(svg, allParcelles, getCurrentArrData(), path, arrLayer);
    } else {
      svg.selectAll(".prairie-layer").remove();
    }
  })
};