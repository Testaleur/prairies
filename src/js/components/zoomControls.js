import { getCurrentView, getCurrentZoomLevel } from "../config.js";

export function createZoomControls(svg, zoom) {

  const container = svg.append("g")
    .attr("class", "zoom-controls")
    .style("display", "none");

  const buttonSize = 32;
  const margin = 15;
  const marginBottom = 40;

  function updatePosition() {
    const { width, height } = svg.node().getBoundingClientRect();
    container.attr(
      "transform",
      `translate(${width - buttonSize - margin}, ${height - 3 * buttonSize - margin - marginBottom})`
    );
  }

  updatePosition();
  window.addEventListener("resize", updatePosition);

  const zoomIn = container.append("g")
    .attr("class", "zoom-in")
    .style("cursor", "pointer");

  zoomIn.append("rect")
    .attr("width", buttonSize)
    .attr("height", buttonSize)
    .attr("rx", 6)
    .attr("fill", "#fff")
    .attr("stroke", "#333");

  zoomIn.append("text")
    .attr("x", buttonSize / 2)
    .attr("y", buttonSize / 2 + 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 24)
    .attr("font-weight", "bold")
    .style("user-select", "none")
    .style("-webkit-user-select", "none")
    .style("-moz-user-select", "none")
    .style("-ms-user-select", "none")
    .text("+");

  const zoomOut = container.append("g")
    .attr("class", "zoom-out")
    .attr("transform", `translate(0, ${buttonSize + 6})`)
    .style("cursor", "pointer");

  zoomOut.append("rect")
    .attr("width", buttonSize)
    .attr("height", buttonSize)
    .attr("rx", 6)
    .attr("fill", "#fff")
    .attr("stroke", "#333");

  zoomOut.append("text")
    .attr("x", buttonSize / 2)
    .attr("y", buttonSize / 2 + 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 24)
    .attr("font-weight", "bold")
    .style("user-select", "none")
    .style("-webkit-user-select", "none")
    .style("-moz-user-select", "none")
    .style("-ms-user-select", "none")
    .text("-");

  const resetZoom = container.append("g")
    .attr("class", "zoom-in")
    .attr("transform", `translate(0, ${2*(buttonSize + 6)})`)
    .style("cursor", "pointer");

  resetZoom.append("rect")
    .attr("width", buttonSize)
    .attr("height", buttonSize)
    .attr("rx", 6)
    .attr("fill", "#fff")
    .attr("stroke", "#333");

  resetZoom.append("text")
    .attr("x", buttonSize / 2)
    .attr("y", buttonSize / 2 + 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 24)
    .attr("font-weight", "bold")
    .style("user-select", "none")
    .style("-webkit-user-select", "none")
    .style("-moz-user-select", "none")
    .style("-ms-user-select", "none")
    .text("⟳");

  resetZoom.on("click", () => {
    const zoomingLevel = getCurrentZoomLevel();
    svg.transition().duration(300).call(
      zoom.transform,
      zoomingLevel
    );
  });

  zoomIn.on("click", () => {
    svg.transition().duration(300).call(zoom.scaleBy, 1.3);
  });

  zoomOut.on("click", () => {
    svg.transition().duration(300).call(zoom.scaleBy, 0.75);
  });

  function updateVisibility() {
    const view = getCurrentView();
    container.style("display", view === "ARRONDISSEMENT" ? "block" : "none");
  }

  return { updateVisibility };
}

export function enablePanAndZoom(svg, zoom) {
  svg.call(zoom);
}

export function disablePanAndZoom(svg) {
  svg.on(".zoom", null);
}