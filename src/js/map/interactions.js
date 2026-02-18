import { showDepartments, showArrondissements } from "./layers.js";
import { setCurrentDeptData, setCurrentRegionData, setCurrentView } from "../config.js";

export function zoomToFeature(path, svg, zoom, d, paddingFactor = 0.8) {
  const [[x0, y0], [x1, y1]] = path.bounds(d);
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity
      .translate(svg.node().getBoundingClientRect().width / 2, svg.node().getBoundingClientRect().height / 2)
      .scale(Math.min(40, paddingFactor / Math.max((x1 - x0) / svg.node().getBoundingClientRect().width, (y1 - y0) / svg.node().getBoundingClientRect().height)))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
  );
}

export function clicked(event, d, path, svg, zoom, regionsLayer, deptsData, deptToRegion, currentDataMap, tooltip, deptsLayer, backButton, arrLayer, arrData) {
  setCurrentRegionData(d);
  setCurrentView("REGION");
  backButton.style("display", "block").text("← Retour à la France");
  if (event) event.stopPropagation();
  zoomToFeature(path, svg, zoom, d, 0.7);
  showDepartments(
    d.properties.nom, 
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
    arrData);
}

export function zoomToDept(event, d, backButton, path, svg, zoom, arrLayer, arrData, currentDataMap, tooltip, deptsLayer) {
  setCurrentDeptData(d);
  setCurrentView("DEPARTEMENT");
  event.stopPropagation();
  backButton.text("← Retour à la Région");
  zoomToFeature(path, svg, zoom, d, 0.8);
  showArrondissements(
    d.properties.code,
    backButton,
    deptsLayer,
    arrLayer,
    arrData,
    currentDataMap,
    svg,
    path,
    tooltip);
}

export function zoomToArr(event, d, backButton) {
  setCurrentView("ARRONDISSEMENT");
  event.stopPropagation();
  backButton.text("← Retour au Département");
  zoomToFeature(path, svg, zoom, d, 0.9);
  arrLayer.selectAll("path").transition().duration(750).style("opacity", node => node === d ? 1 : 0.1);
}