// Tooltip partagé, créé une seule fois dans le DOM
let histoTooltip = d3.select("#histogram-surf-tooltip");
if (histoTooltip.empty()) {
    histoTooltip = d3.select("body")
        .append("div")
        .attr("id", "histogram-surf-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("z-index", "2000")
        .style("opacity", 0);
}

export function updateHistogram_Surf(parcelles, zoneName = "France") {
    d3.select("#histogram-surf-section h3")
      .text(`Répartition par surface - ${zoneName}`);

    const container = d3.select("#histogram-surf-container");
    if (container.empty()) return;
    
    const width = container.node().clientWidth;
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 70, left: 70 };

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // 1. Préparation des données
    const surfs = parcelles.map(p => +p.SURF_PARC).filter(s => !isNaN(s) && s > 0);

    if (surfs.length === 0) {
        svg.append("text")
            .attr("x", width / 2).attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "#999")
            .text("Aucune donnée de surface disponible");
        return;
    }

    // 2. Définition des seuils personnalisés pour l'axe X
    const maxVal = d3.max(surfs);
    const thresholds = [0, 20, 50, 100, 200, 500, 1000, 6500];

    const binner = d3.bin()
        .domain([0, 6500])
        .thresholds(thresholds);

    const bins = binner(surfs).filter(d => d.x0 !== d.x1);

    // 3. Échelles
    const x = d3.scaleBand()
        .domain(bins.map(d => `${d.x0}–${d.x1}`))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    // Axe Y en échelle LINEAIRE
    const y = d3.scaleLinear() 
        .domain([0, d3.max(bins, d => d.length) || 1]).nice()
        .range([height - margin.bottom, margin.top]);

    // 4. Dessin des barres
    svg.append("g")
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", d => x(`${d.x0}–${d.x1}`))
        .attr("y", d => y(d.length))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.length))
        .attr("fill", "#f39c12")
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", "#d35400");
            histoTooltip
                .style("opacity", 1)
                .html(`
                    <strong>Surface : ${d.x0} à ${d.x1} ha</strong><br/>
                    ${d.length.toLocaleString("fr-FR")} parcelles
                `);
        })
        .on("mousemove", (event) => {
            histoTooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("fill", "#f39c12");
            histoTooltip.style("opacity", 0);
        });

    // 5. Axe X
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .style("font-size", "11px");

    // 6. Axe Y (Linéaire)
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format("~s")));

    // Labels des axes
    svg.append("text")
    // --- Label Axe X (TITRE AJOUTÉ ICI) ---
    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
        .attr("y", height - 15) // Positionné près du bord bas
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Surface (ha)");

    // --- Label axe Y (Ajouté ici) ---
    svg.append("text")
        .attr("transform", "rotate(-90)") // Rotation pour l'aligner verticalement
        .attr("x", -(height / 2))         // Centré par rapport à la hauteur
        .attr("y", 20)                    // Positionné à gauche de l'axe
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Nombre de parcelles");
}