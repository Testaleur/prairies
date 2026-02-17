import { getCurrentRegionData, regCodeToName, deptCodeToName } from "../config";
import { processData } from "../map/dataProcessing.js";
import { updateLegend } from "../map/legend.js";
import { showDepartments } from "../map/layers.js";

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
) {

  function updateVisualization() {
    const prairieType = document.getElementById("prairie-type-select").value;
    const selectedDisplay = document.getElementById("affichage-type-select").value;

    currentDataMap = processData(
      allParcelles,
      prairieType,
      regCodeToName,
      deptCodeToName
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

    const currentRegionData = getCurrentRegionData();

    if (currentRegionData) {
      const regionName = currentRegionData.properties.nom;

      const filteredDepts = deptsData.features.filter(
        f => deptToRegion[f.properties.code] === regionName
      );

      const localMax =
        d3.max(
          filteredDepts,
          f => currentDataMap.get(f.properties.nom.trim())?.[propertyToUse]
        ) || 1;

      const localScale = d3.scaleSequential()
        .domain([0, localMax])
        .interpolator(d3.interpolateGreens);

      updateLegend(svg, localMax, label);

      deptsLayer.selectAll("path")
        .transition()
        .duration(500)
        .attr("fill", d =>
          localScale(
            currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0
          )
        );

    } else {
      updateLegend(svg, newMaxRegion, label);

      regionsLayer.selectAll("path")
        .transition()
        .duration(500)
        .attr("fill", d =>
          regionScale(
            currentDataMap.get(d.properties.nom.trim())?.[propertyToUse] || 0
          )
        );
    }
  }

  // Prairie type change
  d3.select("#prairie-type-select").on("change", updateVisualization);

  // Display mode change (NB / SURFACE)
  d3.select("#affichage-type-select").on("change", updateVisualization);
}
