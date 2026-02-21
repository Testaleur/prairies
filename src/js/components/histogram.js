const labelsTraduction = {
    "PPH": "Prairies permanentes",
    "SPH": "Surfaces pastorales (herbe)",
    "SPL": "Surfaces pastorales (fourrage)",
    "CAE": "Châtaigneraie",
    "CEE": "Chênaie"
};

// Ajout de l'argument 'zoneName'
export function updateHistogram(data, zoneName = "France") {
    // 1. Mettre à jour le titre textuel
    d3.select("#histogram-section h3")
      .text(`Répartition par type de prairie - ${zoneName}`);

    const container = d3.select("#histogram-container");
    const width = container.node().clientWidth;
    const height = 350; 
    const margin = {top: 20, right: 30, bottom: 100, left: 60};

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const formattedData = data.map(d => ({
        type: labelsTraduction[d.type] || d.type,
        count: d.count
    }));

    const x = d3.scaleBand()
        .domain(formattedData.map(d => d.type))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(formattedData, d => d.count) || 1]).nice()
        .range([height - margin.bottom, margin.top]);

    // Barres
    svg.append("g")
        .selectAll("rect")
        .data(formattedData)
        .join("rect")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", "#27ae60");

    // Axe X avec rotation pour la lisibilité
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-25)") // Inclinaison pour éviter que les noms se chevauchent
        .style("text-anchor", "end")
        .style("font-size", "12px");

    // Axe Y
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));
}