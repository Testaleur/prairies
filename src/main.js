import * as d3 from "d3";
import { drawMap } from "./map.js";

const width = 1200;
const height = 800;

const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("#tooltip");

drawMap(svg, tooltip, width, height);
