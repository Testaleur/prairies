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

    // 1. Préparation des données (on ignore les valeurs nulles ou aberrantes)
    const surfs = parcelles.map(p => +p.SURF_PARC).filter(s => !isNaN(s) && s > 0);

    if (surfs.length === 0) {
        svg.append("text")
            .attr("x", width / 2).attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "#999")
            .text("Aucune donnée de surface disponible");
        return;
    }

    // 2. Définition des seuils "intelligents"
    // On crée des tranches fines au début (0, 1, 2, 5...) et larges à la fin
    const maxVal = d3.max(surfs);
    const thresholds = [0, 20, 50, 100, 200, 500, 1000, 6500];

    const binner = d3.bin()
        .domain([0, 6500])
        .thresholds(thresholds);

    const bins = binner(surfs).filter(d => d.x0 !== d.x1); // Éviter les bins vides de largeur nulle

    // 3. Échelles
    const x = d3.scaleBand()
        .domain(bins.map(d => `${d.x0}–${d.x1}`))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    // Utilisation de scaleSqrt (racine carrée) pour l'axe Y 
    // Cela permet de mieux voir les petites barres quand la première est très haute
    const y = d3.scaleSqrt() 
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
        .attr("fill", "#27ae60")
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", "#1e8449");
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
            d3.select(event.currentTarget).attr("fill", "#27ae60");
            histoTooltip.style("opacity", 0);
        });

    // 5. Axe X (Labels tranches)
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .style("font-size", "11px");

    // 6. Axe Y (Nombre de parcelles)
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format("~s"))); // Format compact (ex: 10k)

    // Label horizontal pour l'unité de l'axe X
    svg.append("text")
        .attr("x", width - margin.right)
        .attr("y", height - margin.bottom + 40)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("Hectares (ha)");

    // Label vertical pour l'axe Y
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text("Nombre de parcelles");
}