import { drawMap } from "./map.js";

window.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById("map-container");
    const width = mapContainer.clientWidth;
    const height = mapContainer.clientHeight;

    const svg = d3
      .select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3.select("#tooltip");

    drawMap(svg, tooltip, width, height);
});