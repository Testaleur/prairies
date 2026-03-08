// Tooltip dédié au scatterplot (inchangé)
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

    // 1. Préparation de TOUTES les données
    let allData = parcelles
        .map(p => ({ alt: +p.alt_mean, surf: +p.SURF_PARC }))
        .filter(d => !isNaN(d.alt) && !isNaN(d.surf) && d.surf > 0);

    if (allData.length === 0) return;

    // 2. Calcul des limites réelles (stabilité de l'axe)
    const absoluteMaxSurf = d3.max(allData, d => d.surf);
    const absoluteMaxAlt = d3.max(allData, d => d.alt);

    // 3. Échantillonnage INTELLIGENT
    let displayData;
    if (allData.length <= 5000) {
        displayData = allData;
    } else {
        // Étape A : On isole les points "records" (ceux qui touchent les bords du graph)
        // On prend les 10 plus grandes surfaces et les 10 plus hautes altitudes pour être sûr
        const sortedBySurf = [...allData].sort((a, b) => b.surf - a.surf);
        const sortedByAlt = [...allData].sort((a, b) => b.alt - a.alt);
        
        const topPoints = new Set([
            ...sortedBySurf.slice(0, 10), 
            ...sortedByAlt.slice(0, 10)
        ]);

        // Étape B : On prépare le reste des données pour le tirage au sort
        const others = allData.filter(d => !topPoints.has(d));
        
        // Étape C : On mélange et on complète pour arriver à 5000 points
        const sampledOthers = d3.shuffle(others).slice(0, 5000 - topPoints.size);
        
        displayData = [...topPoints, ...sampledOthers];
    }

    // 4. Échelles (toujours basées sur les records réels)
    const x = d3.scaleLinear()
        .domain([0, absoluteMaxAlt]).nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, absoluteMaxSurf]).nice()
        .range([height - margin.bottom, margin.top]);

    // 5. Axes et Labels
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(10));
        
    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
        .attr("y", height - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Altitude (m)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Surface (ha)");

    // 6. Dessin des points
    svg.append("g")
        .selectAll("circle")
        .data(displayData)
        .join("circle")
        .attr("cx", d => x(d.alt))
        .attr("cy", d => y(d.surf))
        .attr("r", 3)
        .attr("fill", "#9b59b6")
        .attr("opacity", 0.6)
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("r", 6).attr("opacity", 1).attr("stroke", "#000");
            scatterTooltip.style("opacity", 1)
                .html(`<strong>Altitude :</strong> ${Math.round(d.alt)} m<br/><strong>Surface :</strong> ${d.surf.toFixed(2)} ha`);
        })
        .on("mousemove", (event) => {
            scatterTooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("r", 3).attr("opacity", 0.6).attr("stroke", "none");
            scatterTooltip.style("opacity", 0);
        });
}