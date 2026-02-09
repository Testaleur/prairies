export function drawMap(svg, tooltip, width, height) {
  const BASE_URL = import.meta.env.BASE_URL;

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

  let currentRegionData = null;

  Promise.all([
  d3.json(`${BASE_URL}regions.geojson`),
  d3.json(`${BASE_URL}departements.geojson`),
  d3.json(`${BASE_URL}arrondissements.geojson`), // Ajout du fichier
  d3.csv(`${BASE_URL}data.csv`)
]).then(([regionsData, deptsData, arrData, data]) => { // On récupère arrData

    const dataMap = new Map(data.map(d => [d.nom.trim(), +d.value]));
    const maxValue = d3.max(data, d => +d.value) || 100;

    const colorScale = d3.scaleSequential()
  .domain([0, maxValue])
  .interpolator(d3.interpolateGreens);

    const projection = d3.geoConicConformal()
      .center([2.2137, 46.2276])
      .scale(3000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");
    const deptsLayer = g.append("g").attr("class", "depts-layer");
    const regionsLayer = g.append("g").attr("class", "regions-layer");
    const arrLayer = g.append("g").attr("class", "arr-layer");

    const zoom = d3.zoom()
      .scaleExtent([1, 40]) // On augmente la limite de zoom max
      .on("zoom", (event) => g.attr("transform", event.transform));

    const backButton = d3.select("body").append("button")
      .attr("id", "back-button")
      .text("← Retour à la France")
      .style("position", "absolute").style("top", "20px").style("left", "20px")
      .style("display", "none").style("z-index", "1000")
      .on("click", reset);

    function reset() {
  const currentText = backButton.text();

  if (currentText === "← Retour au Département") {
    backButton.text("← Retour à la Région");
    arrLayer.selectAll("path").transition().duration(500).style("opacity", 1);
    zoomToFeature(currentRegionData, 0.8);
  } 
  else if (currentText === "← Retour à la Région") {
    backButton.text("← Retour à la France");
    arrLayer.selectAll("path").remove(); // On vide les arrondissements
    deptsLayer.selectAll("path").transition().duration(500).style("opacity", 1);
    deptsLayer.selectAll("path").style("pointer-events", "all");
    zoomToFeature(currentRegionData, 0.8);
  } 
  else {
    // Retour total à la France
    backButton.style("display", "none");
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    regionsLayer.selectAll("path").transition().duration(500).style("opacity", 1).style("pointer-events", "all");
    deptsLayer.selectAll("path").transition().duration(500).style("opacity", 0).remove();
    arrLayer.selectAll("path").remove();
    currentRegionData = null;
  }
}

    // Fonction générique pour zoomer proprement sans coller aux bords
    function zoomToFeature(d, paddingFactor = 0.8) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(40, paddingFactor / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
    }

    function clicked(event, d) {
      currentRegionData = d;
      backButton.style("display", "block").text("← Retour à la France");
      if (event) event.stopPropagation();

      zoomToFeature(d, 0.7); // Zoom région avec marge
      showDepartments(d.properties.nom);
    }

    function zoomToDept(event, d) {
  event.stopPropagation();
  const deptCode = d.properties.code; 
  backButton.text("← Retour à la Région");

  zoomToFeature(d, 0.8);

  // On cache le département pour voir les arrondissements
  deptsLayer.selectAll("path").style("pointer-events", "none");
  deptsLayer.selectAll("path").transition().duration(500).style("opacity", 0);

  // Filtrage des arrondissements appartenant au département (code_dept ou les 2 premiers chiffres du code arr)
  // Note : vérifie si dans ton JSON la propriété est "code" ou "code_dept"
  const filteredArrs = arrData.features.filter(f => f.properties.code.startsWith(deptCode));

  const arrondissements = arrLayer.selectAll("path").data(filteredArrs, d => d.properties.nom);

  arrondissements.enter()
        .append("path")
        .attr("d", path)
        .style("vector-effect", "non-scaling-stroke")
        .attr("fill", d => {
          const name = d.properties.nom.trim();
          const val = dataMap.get(name);
          // Si on trouve la valeur dans le CSV on colorie, sinon gris clair
          return val !== undefined ? colorScale(val) : "#eee";
        })
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", (event, d) => {
          const name = d.properties.nom.trim();
          const val = dataMap.get(name) || "Aucune donnée";
          
          tooltip.style("opacity", 1)
            .html(`<strong>Arrondissement :</strong> ${name}<br/>Nombre de prairies : ${val}`);
          
          // Effet de bordure au survol
          d3.select(event.currentTarget)
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .raise();
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          
          // On remet la bordure normale
          d3.select(event.currentTarget)
            .attr("stroke", "#999")
            .attr("stroke-width", 0.5);
        })
        .on("click", (event, d) => {
          // Appel de la fonction pour zoomer encore plus (vers les futures prairies)
          zoomToArr(event, d);
        })
        .transition()
        .duration(500)
        .style("opacity", 1);
}

    function zoomToArr(event, d) {
  event.stopPropagation();
  backButton.text("← Retour au Département");
  zoomToFeature(d, 0.9);
  
  // On peut isoler l'arrondissement
  arrLayer.selectAll("path")
    .transition().duration(750)
    .style("opacity", node => node === d ? 1 : 0.1);
}

    function showDepartments(regionName) {
      regionsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");

      const filteredDepts = deptsData.features.filter(f => deptToRegion[f.properties.code] === regionName);

      const depts = deptsLayer.selectAll("path").data(filteredDepts, d => d.properties.nom);

      depts.enter()
        .append("path")
        .attr("d", path)
        .style("vector-effect", "non-scaling-stroke")
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
          tooltip.style("opacity", 1).html(`<strong>Département :</strong> ${name}<br/>Nombre de prairies : ${val}`);
          d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 0.5);
        })
        .on("click", (event, d) => zoomToDept(event, d))
        .transition().duration(500).style("opacity", 1);
    }

    regionsLayer.selectAll("path")
      .data(regionsData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("vector-effect", "non-scaling-stroke")
      .attr("fill", d => {
        const val = dataMap.get(d.properties.nom.trim());
        return val ? colorScale(val) : "#ddd";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        const name = d.properties.nom;
        const val = dataMap.get(name.trim()) || "Aucune donnée";
        tooltip.style("opacity", 1).html(`<strong>Région :</strong> ${name}<br/>Nombre de prairies : ${val}`);
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
  });
}