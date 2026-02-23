import { updateLegend } from "./legend.js";
import { showDepartments, showArrondissements } from "../map/layers.js";
import { zoomToFeature } from "../map/interactions.js";
import { setCurrentRegionData, getCurrentRegionData, setCurrentView, getCurrentView, getCurrentDeptData, setCurrentDeptData, setCurrentArrData } from "../config.js";
import { updateHistogram_Type } from "./histogram_type.js";

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

    if (getCurrentView() === "ARRONDISSEMENT") {
      setCurrentView("DEPARTEMENT");
      backButton.text("← Retour à la Région");
      arrLayer.selectAll("path").remove();
      const dept = getCurrentDeptData();
      if (dept) {
        showArrondissements(
          dept.properties.code,
          backButton,
          deptsLayer,
          arrLayer,
          arrData,
          currentDataMap,
          svg,
          path,
          tooltip,
          zoom);
        if (window.allParcellesData) {
          const deptCode = String(parseInt(dept.properties.code));
          const filtered = window.allParcellesData.filter(p => String(parseInt(p.dep_parc)) === deptCode);
          const counts = d3.rollup(filtered, v => v.length, d => d.CODE_CULTU);
          updateHistogram_Type(Array.from(counts, ([type, count]) => ({ type, count })), dept.properties.nom);
        }
      }
      zoomToFeature(path, svg, zoom, dept, 0.9);
      setCurrentArrData(null);
    }

    else if (getCurrentView() === "DEPARTEMENT") {
      setCurrentView("REGION");
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
        if (window.allParcellesData) {
          const regionCode = String(region.properties.code);
          const filtered = window.allParcellesData.filter(p => String(p.reg_parc).split('.')[0] === regionCode);
          const counts = d3.rollup(filtered, v => v.length, d => d.CODE_CULTU);
          updateHistogram_Type(Array.from(counts, ([type, count]) => ({ type, count })), region.properties.nom);
        }
        }
        zoomToFeature(path, svg, zoom, region, 0.8);
        setCurrentDeptData(null)
      }

    else if (getCurrentView() === "REGION") {
      setCurrentView("FRANCE");
      backButton.style("display", "none");

      arrLayer.selectAll("path").remove();
      deptsLayer.selectAll("path").remove();

      const maxVal =
        d3.max(regionsNames, n => currentDataMap.get(n)?.count) || 100;
      const maxSurface =
        d3.max(regionsNames, n => currentDataMap.get(n)?.surface) || 100;
      const selectedDisplay = document.getElementById("affichage-type-select").value;
      const selectedMax = selectedDisplay === "NB" ? maxVal : maxSurface;
      const label = selectedDisplay === "NB" ? "Nombre de prairies" : "Surface de prairies (ha)";

      updateLegend(svg, selectedMax, label);

      if (window.allParcellesData) {
        const counts = d3.rollup(window.allParcellesData, v => v.length, d => d.CODE_CULTU);
        updateHistogram_Type(Array.from(counts, ([type, count]) => ({ type, count })), "France");
      }

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