// Tooltip dédié au scatterplot
let scatterTooltip = d3.select("#scatter-tooltip");
if (scatterTooltip.empty()) {
    scatterTooltip = d3.select("body")
        .append("div")
        .attr("id", "scatter-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("z-index", "2000")
        .style("opacity", 0);
}

export function updateScatter_AltiSurf(parcelles, zoneName = "France") {
    d3.select("#scatter-section h3").text(`Corrélation Altitude / Surface - ${zoneName}`);

    const container = d3.select("#scatter-container");
    if (container.empty()) return;

    const width = container.node().clientWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    container.selectAll("*").remove();
    const svg = container.append("svg").attr("width", width).attr("height", height);

    // 1. Filtrage et préparation des données (échantillonnage si trop de points)
    let data = parcelles
        .map(p => ({ alt: +p.alt_mean, surf: +p.SURF_PARC }))
        .filter(d => !isNaN(d.alt) && !isNaN(d.surf) && d.surf > 0);

    // Si trop de points (> 2000), on échantillonne pour garder de la performance
    if (data.length > 2000) {
        data = d3.shuffle(data).slice(0, 2000);
    }

    // 2. Échelles
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.alt) || 3000]).nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.surf) || 100]).nice()
        .range([height - margin.bottom, margin.top]);

    // 3. Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(10))
        .append("text")
        .attr("x", width - margin.right)
        .attr("y", -10)
        .attr("fill", "#666")
        .attr("text-anchor", "end")
        
    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
        .attr("y", height - 15) // Positionné près du bord bas
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Altitude (m)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8))
        .append("text")
        .attr("x", 10)
        .attr("y", margin.top)
        .attr("fill", "#666")
        .attr("text-anchor", "start")
        .attr("transform", "rotate(-90)")

    // --- Label axe Y (Ajouté ici) ---
    svg.append("text")
        .attr("transform", "rotate(-90)") // Rotation pour l'aligner verticalement
        .attr("x", -(height / 2))         // Centré par rapport à la hauteur
        .attr("y", 20)                    // Positionné à gauche de l'axe
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Surface (ha)");
        

    // 4. Points (Cercles)
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.alt))
        .attr("cy", d => y(d.surf))
        .attr("r", 3)
        .attr("fill", "#9b59b6") // Couleur Violette pour ce graphique
        .attr("opacity", 0.5)
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
                .attr("r", 6)
                .attr("opacity", 1)
                .attr("stroke", "#000");
            
            scatterTooltip.style("opacity", 1)
                .html(`<strong>Altitude :</strong> ${Math.round(d.alt)} m<br/><strong>Surface :</strong> ${d.surf.toFixed(2)} ha`);
        })
        .on("mousemove", (event) => {
            scatterTooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget)
                .attr("r", 3)
                .attr("opacity", 0.5)
                .attr("stroke", "none");
            scatterTooltip.style("opacity", 0);
        });
}