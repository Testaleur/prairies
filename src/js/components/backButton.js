import { updateLegend } from "../map/legend.js";
import { showDepartments } from "../map/layers.js";
import { zoomToFeature } from "../map/interactions.js";
import { setCurrentRegionData, getCurrentRegionData } from "../config.js";

export function createBackButton(
  arrLayer,
  deptsLayer,
  deptsData,
  regionsLayer,
  deptToRegion,
  path,
  svg,
  zoom,
  regionsNames,
  currentDataMap,
  tooltip,
  arrData
) {

  const backButton = d3.select("#map-container")
    .append("button")
    .attr("id", "back-button")
    .text("← Retour à la France")
    .style("position", "absolute")
    .style("top", "70px")
    .style("left", "20px")
    .style("display", "none")
    .style("z-index", "1000")
    .on("click", () => reset());

  function reset() {
    const currentText = backButton.text();

    if (currentText === "← Retour au Département") {
      backButton.text("← Retour à la Région");
      arrLayer.selectAll("path")
        .transition()
        .duration(500)
        .style("opacity", 1);

      zoomToFeature(path, svg, zoom, 0.8);
    }

    else if (currentText === "← Retour à la Région") {
      backButton.text("← Retour à la France");
      arrLayer.selectAll("path").remove();
      const region = getCurrentRegionData();
      if (region) {
        showDepartments(
          region.properties.nom, 
          regionsLayer,
          deptsData,
          deptToRegion,
          currentDataMap,
          svg,
          path,
          deptsLayer,
          tooltip,
          backButton,
          zoom,
          arrLayer,
          arrData)
        }
        zoomToFeature(path, svg, zoom, region, 0.8);
      }

    else {
      backButton.style("display", "none");

      arrLayer.selectAll("path").remove();
      deptsLayer.selectAll("path").remove();

      const maxVal =
        d3.max(regionsNames, n => currentDataMap.get(n)?.count) || 100;

      updateLegend(svg, maxVal, "Valeur par Région");

      regionsLayer.selectAll("path")
        .transition()
        .duration(500)
        .style("opacity", 1)
        .style("pointer-events", "all");

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);

      setCurrentRegionData(null);
    }
  }

  return backButton;
}
