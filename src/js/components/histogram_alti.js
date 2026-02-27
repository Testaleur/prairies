// Tooltip partagé, créé une seule fois dans le DOM
let histoTooltip = d3.select("#histogram-alti-tooltip");
if (histoTooltip.empty()) {
    histoTooltip = d3.select("body")
        .append("div")
        .attr("id", "histogram-alti-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("opacity", 0);
}

// Reçoit un tableau de parcelles brutes (pas encore agrégées)
export function updateHistogram_Alti(parcelles, zoneName = "France") {
    d3.select("#histogram-alti-section h3")
      .text(`Répartition par altitude - ${zoneName}`);

    const container = d3.select("#histogram-alti-container");
    const width = container.node().clientWidth;
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // --- Calcul des tranches d'altitude ---
    const BIN_SIZE = 200; // largeur de chaque tranche en mètres
    const alts = parcelles.map(p => +p.alt_mean).filter(a => !isNaN(a));

    if (alts.length === 0) {
        svg.append("text")
            .attr("x", width / 2).attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "#999")
            .text("Aucune donnée d'altitude disponible");
        return;
    }

    const minAlt = Math.floor(d3.min(alts) / BIN_SIZE) * BIN_SIZE;
    const maxAlt = Math.ceil(d3.max(alts) / BIN_SIZE) * BIN_SIZE;

    // Créer toutes les tranches
    const bins = [];
    for (let low = minAlt; low < maxAlt; low += BIN_SIZE) {
        const high = low + BIN_SIZE;
        const count = alts.filter(a => a >= low && a < high).length;
        bins.push({ label: `${low}–${high}`, low, high, count });
    }

    // --- Échelles ---
    const x = d3.scaleBand()
        .domain(bins.map(b => b.label))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, b => b.count) || 1]).nice()
        .range([height - margin.bottom, margin.top]);

    // --- Barres ---
    svg.append("g")
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", b => x(b.label))
        .attr("y", b => y(b.count))
        .attr("width", x.bandwidth())
        .attr("height", b => y(0) - y(b.count))
        .attr("fill", "#27ae60")
        .style("cursor", "pointer")
        .on("mouseover", (event, b) => {
            d3.select(event.currentTarget).attr("fill", "#1e8449");
            histoTooltip
                .style("opacity", 1)
                .html(`<strong>${b.label} m</strong><br/>${b.count.toLocaleString("fr-FR")} parcelles`);
        })
        .on("mousemove", (event) => {
            histoTooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("fill", "#27ae60");
            histoTooltip.style("opacity", 0);
        });

    // --- Axe X ---
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")
        .style("font-size", "11px");

    // --- Axe Y ---
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));

    // --- Label axe Y ---
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#555")
        .text("Nombre de parcelles");
}