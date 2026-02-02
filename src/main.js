// src/main.js

import { drawMap } from "./map.js";

// SVG setup
const width = 1200;
const height = 800;

const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("#tooltip");

// Compute base path dynamically for GitHub Pages & local dev
const isVite = Boolean(import.meta.env); // true if running in Vite dev
const BASE_PATH = isVite ? "" : window.location.pathname.replace(/\/[^/]*$/, "");
const dataUrl = (file) => `${BASE_PATH}/${file}`;

// Async function to load data and draw map
async function loadData() {
  try {
    const geoData = await d3.json(dataUrl("regions.geojson"));
    const data = await d3.csv(dataUrl("data.csv"));

    drawMap(svg, tooltip, width, height, geoData, data);
  } catch (err) {
    console.error("Error loading map/data:", err);
  }
}

// Start
loadData();
