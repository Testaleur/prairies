export function drawMap(svg, tooltip, width, height) {
  const BASE_URL = import.meta.env.BASE_URL;

  // Table de correspondance pour lier les codes départements aux régions
  const deptToRegion = {
    "01": "Auvergne-Rhône-Alpes", "03": "Auvergne-Rhône-Alpes", "07": "Auvergne-Rhône-Alpes", "15": "Auvergne-Rhône-Alpes", "26": "Auvergne-Rhône-Alpes", "38": "Auvergne-Rhône-Alpes", "42": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "63": "Auvergne-Rhône-Alpes", "69": "Auvergne-Rhône-Alpes", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes",
    "21": "Bourgogne-Franche-Comté", "25": "Bourgogne-Franche-Comté", "39": "Bourgogne-Franche-Comté", "58": "Bourgogne-Franche-Comté", "70": "Bourgogne-Franche-Comté", "71": "Bourgogne-Franche-Comté", "89": "Bourgogne-Franche-Comté", "90": "Bourgogne-Franche-Comté",
    "22": "Bretagne", "29": "Bretagne", "35": "Bretagne", "56": "Bretagne",
    "18": "Centre-Val de Loire", "28": "Centre-Val de Loire", "36": "Centre-Val de Loire", "37": "Centre-Val de Loire", "41": "Centre-Val de Loire", "45": "Centre-Val de Loire",
    "2A": "Corse", "2B": "Corse",
    "08": "Grand Est", "10": "Grand Est", "51": "Grand Est", "52": "Grand Est", "54": "Grand Est", "55": "Grand Est", "57": "Grand Est", "67": "Grand Est", "68": "Grand Est", "88": "Grand Est",
    "02": "Hauts-de-France", "59": "Hauts-de-France", "60": "Hauts-de-France", "62": "Hauts-de-France", "80": "Hauts-de-France",
    "75": "Île-de-France", "77": "Île-de-France", "78": "Île-de-France", "91": "Île-de-France", "92": "Île-de-France", "93": "Île-de-France", "94": "Île-de-France", "95": "Île-de-France",
    "14": "Normandie", "27": "Normandie", "50": "Normandie", "61": "Normandie", "76": "Normandie",
    "16": "Nouvelle-Aquitaine", "17": "Nouvelle-Aquitaine", "19": "Nouvelle-Aquitaine", "23": "Nouvelle-Aquitaine", "24": "Nouvelle-Aquitaine", "33": "Nouvelle-Aquitaine", "40": "Nouvelle-Aquitaine", "47": "Nouvelle-Aquitaine", "64": "Nouvelle-Aquitaine", "79": "Nouvelle-Aquitaine", "86": "Nouvelle-Aquitaine", "87": "Nouvelle-Aquitaine",
    "09": "Occitanie", "11": "Occitanie", "12": "Occitanie", "30": "Occitanie", "31": "Occitanie", "32": "Occitanie", "34": "Occitanie", "46": "Occitanie", "48": "Occitanie", "65": "Occitanie", "66": "Occitanie", "81": "Occitanie", "82": "Occitanie",
    "44": "Pays de la Loire", "49": "Pays de la Loire", "53": "Pays de la Loire", "72": "Pays de la Loire", "85": "Pays de la Loire",
    "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur", "06": "Provence-Alpes-Côte d'Azur", "13": "Provence-Alpes-Côte d'Azur", "83": "Provence-Alpes-Côte d'Azur", "84": "Provence-Alpes-Côte d'Azur"
  };

  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.json(`${BASE_URL}departements.geojson`),
    d3.csv(`${BASE_URL}data.csv`)
  ]).then(([regionsData, deptsData, data]) => {

    const dataMap = new Map(data.map(d => [d.nom.trim(), +d.value]));
    const maxValue = d3.max(data, d => +d.value) || 100;

    const colorScale = d3.scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolateBlues);

    const projection = d3.geoConicConformal()
      .center([2.2137, 46.2276])
      .scale(3000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Conteneur principal
    const g = svg.append("g");

    // Calques pour séparer régions et départements
    const regionsLayer = g.append("g").attr("class", "regions-layer");
    const deptsLayer = g.append("g").attr("class", "depts-layer");

    const zoom = d3.zoom()
      .scaleExtent([1, 12])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // --- FONCTION RESET (Retour à la France) ---
    function reset() {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
      // Réaffiche les régions et supprime les départements
      regionsLayer.selectAll("path").transition().duration(500).style("opacity", 1).style("pointer-events", "all");
      deptsLayer.selectAll("path").transition().duration(500).style("opacity", 0).remove();
    }

    // --- FONCTION ZOOM SUR RÉGION ---
    function clicked(event, d) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();

      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );

      showDepartments(d.properties.nom);
    }

    // --- AFFICHAGE DES DÉPARTEMENTS ---
    function showDepartments(regionName) {
      // On cache les régions
      regionsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");

      // Filtrer les départements appartenant à cette région
      const filteredDepts = deptsData.features.filter(f => deptToRegion[f.properties.code] === regionName);

      const depts = deptsLayer.selectAll("path").data(filteredDepts, d => d.properties.nom);

      depts.enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
          const val = dataMap.get(d.properties.nom.trim());
          return val !== undefined ? colorScale(val) : "#eee";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", (event, d) => {
          const name = d.properties.nom;
          const val = dataMap.get(name.trim()) || "Aucune donnée";
          tooltip.style("opacity", 1).html(`<strong>Département :</strong> ${name}<br/>Valeur : ${val}`);
          d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 0.5);
        })
        .transition().duration(500).style("opacity", 1);
    }

    // --- DESSIN INITIAL DES RÉGIONS ---
    regionsLayer.selectAll("path")
      .data(regionsData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const val = dataMap.get(d.properties.nom.trim());
        return val ? colorScale(val) : "#ddd";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        const name = d.properties.nom;
        const val = dataMap.get(name.trim()) || "Aucune donnée";
        tooltip.style("opacity", 1).html(`<strong>Région :</strong> ${name}<br/>Valeur : ${val}`);
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1);
      })
      .on("click", clicked);

    // Double-clic sur le fond pour revenir en arrière
    svg.on("dblclick", reset);
  });
}