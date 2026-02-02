export function drawMap(svg, tooltip, width, height) {
  const BASE_URL = import.meta.env.BASE_URL; // Vite automatically sets this
  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.csv(`${BASE_URL}data.csv`)
  ])
    .then(([geoData, data]) => {
      // Convert CSV to Map using region names (strings)
      const dataMap = new Map(data.map(d => [d.nom.trim(), +d.value]));

      console.log("CSV keys:", Array.from(dataMap.keys()));

      // Color scale
      const maxValue = d3.max(data, d => +d.value);
      const colorScale = d3.scaleSequential()
        .domain([0, maxValue])
        .interpolator(d3.interpolateBlues);

      // Projection (France)
      const projection = d3.geoConicConformal()
        .center([2.2137, 46.2276]) // center of France
        .scale(2500)               // adjust for SVG size
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      // Debug: check which regions match
      geoData.features.forEach(f => {
        const name = f.properties.nom.trim();
        const found = dataMap.has(name) ? "Found" : "Not found";
        console.log(name, found);
      });

      // Draw map
      svg.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const name = d.properties.nom.trim();
          const value = dataMap.get(name);
          return value ? colorScale(value) : "#ddd";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        // ... dans ton .on("mouseover")
        .on("mouseover", (event, d) => {
          const name = d.properties.nom.trim();
          const value = dataMap.get(name) || "No data";

            // 1. On sélectionne l'élément
          const target = d3.select(event.currentTarget);

            // 2. On le fait passer au premier plan
          target.raise(); 

            // 3. On applique les styles (passage en noir et plus épais)
          target
            .attr("stroke", "#000") // On change la couleur en noir pour que ce soit visible
            .attr("stroke-width", 2);

        tooltip.style("opacity", 1)
        .html(`<strong>${name}</strong><br/>Value: ${value}`);
})

            // ... dans ton .on("mouseout")
          .on("mouseout", event => {
          d3.select(event.currentTarget)
          .attr("stroke", "#fff") // On remet en blanc
          .attr("stroke-width", 0.5);
    
          tooltip.style("opacity", 0);
});

    })
    .catch(err => console.error("Error loading map/data:", err));
}
