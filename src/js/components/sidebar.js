import { getCurrentRegionData, regCodeToName, deptCodeToName } from "../config";
import { processData } from "../map/dataProcessing.js";
import { updateLegend } from "../map/legend.js";
import { showDepartments } from "../map/layers.js";

export function createSidebar(d3, allParcelles, regionsNames, currentDataMap, regionsLayer, deptsData, deptToRegion, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData) {
  d3.select("#prairie-type-select").on("change", function() {
    const val = this.value;
    currentDataMap = processData(allParcelles, val, regCodeToName, deptCodeToName);
    
    const newMax = d3.max(regionsNames, n => currentDataMap.get(n)?.count) || 1;
    const newScale = d3.scaleSequential().domain([0, newMax]).interpolator(d3.interpolateGreens);
    
    regionsLayer.selectAll("path")
    .transition().duration(500)
    .attr("fill", d => newScale(currentDataMap.get(d.properties.nom.trim())?.count || 0));
    
    updateLegend(svg, newMax, "Valeur par Région");
    
    var currentRegionData = getCurrentRegionData();
    if (currentRegionData) showDepartments(currentRegionData.properties.nom, regionsLayer, deptsData, deptToRegion, currentDataMap, svg, path, deptsLayer, tooltip, backButton, zoom, arrLayer, arrData);
  });  
}