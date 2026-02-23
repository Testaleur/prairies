import { getCurrentRegionData, getCurrentView, getCurrentDeptData } from "../config";
import { processData } from "../map/dataProcessing.js";
import { updateLegend } from "./legend.js";

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
  arrLayer
) {

  function updateVisualization() {
    const prairieType = document.getElementById("prairie-type-select").value;
    const selectedDisplay = document.getElementById("affichage-type-select").value;

    currentDataMap = processData(
      allParcelles,
      prairieType
    );

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
    if(currentRegionData){
      const regionName = currentRegionData.properties.nom;

      const filteredDepts = deptsData.features.filter(
        f => deptToRegion[f.properties.code] === regionName
      );

      var newMaxDep =
        d3.max(
          filteredDepts,
          f => currentDataMap.get(f.properties.nom.trim())?.[propertyToUse]
        ) || 1;

      var depScale = d3.scaleSequential()
        .domain([0, newMaxDep])
        .interpolator(d3.interpolateGreens);
    }

    const currentDeptData = getCurrentDeptData();
    if(currentDeptData){
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
        
    if (currentView === "REGION") {

      updateLegend(svg, newMaxDep, label);
      updateDeptLayer(deptsLayer, currentDataMap, depScale, propertyToUse)
      updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse);
    
    } else if (currentView === "DEPARTEMENT") {

      updateLegend(svg, newMaxArr, label);
      updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse);
      updateDeptLayer(deptsLayer, currentDataMap, depScale, propertyToUse);
      updateArrLayer(arrLayer, currentDataMap, arrScale, propertyToUse);

    } else if (currentView === "FRANCE") {
      updateLegend(svg, newMaxRegion, label);
      updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse);
    }
  }

  // Prairie type change
  d3.select("#prairie-type-select").on("change", updateVisualization);

  // Display mode change (NB / SURFACE)
  d3.select("#affichage-type-select").on("change", updateVisualization);
}

function updateRegionLayer(regionsLayer, currentDataMap, regionScale, propertyToUse) {
  regionsLayer.selectAll("path")
    .transition()
    .duration(500)
    .attr("fill", d =>
      regionScale(
        currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0
      )
    );
}

function updateDeptLayer(deptsLayer, currentDataMap, depScale, propertyToUse) {
  deptsLayer.selectAll("path")
    .transition()
    .duration(500)
    .attr("fill", d =>
      depScale(
        currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0
      )
    );
}

function updateArrLayer(arrLayer, currentDataMap, arrScale, propertyToUse) {
  arrLayer.selectAll("path")
    .transition()
    .duration(500)
    .attr("fill", d =>
      arrScale(
        currentDataMap.get(d.properties.code)?.[propertyToUse] || 0
      )
    );
}