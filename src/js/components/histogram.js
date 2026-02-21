export function updateHistogram(data) {
    const container = d3.select("#histogram-container");
    const width = container.node().clientWidth;
    const height = container.node().clientHeight || 200; // Utilise la hauteur du CSS
    const margin = {top: 20, right: 30, bottom: 50, left: 60};

    container.selectAll("*").remove(); // Nettoyage

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.type))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) || 1]).nice()
        .range([height - margin.bottom, margin.top]);

    // Dessin des barres
    svg.append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", "#27ae60"); // Vert assorti à ton bouton retour

    // Axe X
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-15)") // Incline les textes si les noms sont longs
        .style("text-anchor", "end");

    // Axe Y
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));
}