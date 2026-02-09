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
  let currentDeptData = null;

  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.json(`${BASE_URL}departements.geojson`),
    d3.json(`${BASE_URL}arrondissements.geojson`),
    d3.csv(`${BASE_URL}data.csv`)
  ]).then(([regionsData, deptsData, arrData, data]) => {

    const dataMap = new Map(data.map(d => [d.nom.trim(), +d.value]));

    const regionsNames = regionsData.features.map(f => f.properties.nom.trim());
    const maxValueRegions = d3.max(regionsNames, name => dataMap.get(name)) || 100;

    const projection = d3.geoConicConformal()
      .center([2.2137, 46.2276])
      .scale(3000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");
    const arrLayer = g.append("g").attr("class", "arr-layer");
    const deptsLayer = g.append("g").attr("class", "depts-layer");
    const regionsLayer = g.append("g").attr("class", "regions-layer");

    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .on("zoom", (event) => g.attr("transform", event.transform));

    const backButton = d3.select("#map-container").append("button")
      .attr("id", "back-button")
      .text("← Retour à la France")
      .style("position", "absolute").style("top", "70px").style("left", "20px")
      .style("display", "none").style("z-index", "1000")
      .on("click", reset);

    function reset() {
      const currentText = backButton.text();

      if (currentText === "← Retour au Département") {
        // On remonte de Arrondissement vers la vue Département (donc bouton devient "Retour Région")
        backButton.text("← Retour à la Région");
        arrLayer.selectAll("path").transition().duration(500).style("opacity", 1);
        zoomToFeature(currentDeptData, 0.8);
      } 
      else if (currentText === "← Retour à la Région") {
        // On remonte de Département vers la vue Région (donc bouton devient "Retour France")
        backButton.text("← Retour à la France");
        arrLayer.selectAll("path").remove();
        showDepartments(currentRegionData.properties.nom);
        zoomToFeature(currentRegionData, 0.8);
      } 
      else if (currentText === "← Retour à la France") {
        // On remonte au tout début
        backButton.style("display", "none");
        arrLayer.selectAll("path").remove();
        deptsLayer.selectAll("path").remove();
        updateLegend(maxValueRegions, "Valeur par Région");
        regionsLayer.selectAll("path").transition().duration(500).style("opacity", 1).style("pointer-events", "all");
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        currentRegionData = null;
      }
    }

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
      // On vient de cliquer sur une région, donc le bouton doit ramener à la France
      backButton.style("display", "block").text("← Retour à la France");
      
      if (event) event.stopPropagation();
      zoomToFeature(d, 0.7);
      showDepartments(d.properties.nom);
    }

    function zoomToDept(event, d) {
      event.stopPropagation();
      currentDeptData = d;
      const deptCode = d.properties.code; 
      
      // MISE À JOUR BOUTON : On vient de cliquer sur un département, on veut pouvoir revenir à la Région
      backButton.style("display", "block").text("← Retour à la Région");

      const filteredArrs = arrData.features.filter(f => f.properties.code.startsWith(deptCode));
      const localMax = d3.max(filteredArrs, f => dataMap.get(f.properties.nom.trim())) || 1;
      const localScale = d3.scaleSequential().domain([0, localMax]).interpolator(d3.interpolateGreens);

      updateLegend(localMax, "Valeur par Arrond.");
      zoomToFeature(d, 0.8);

      deptsLayer.selectAll("path").style("pointer-events", "none").transition().duration(500).style("opacity", 0);

      const arrondissements = arrLayer.selectAll("path").data(filteredArrs, d => d.properties.nom);

      arrondissements.enter()
        .append("path")
        .attr("d", path)
        .style("vector-effect", "non-scaling-stroke")
        .attr("fill", d => localScale(dataMap.get(d.properties.nom.trim()) || 0))
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", (event, d) => {
          const name = d.properties.nom.trim();
          const val = dataMap.get(name) || 0;
          
          // Tooltip riche
          tooltip.style("opacity", 1).html(`
            <div style="font-weight:bold; font-size:15px; margin-bottom:5px;">${name}</div>
            <hr style="margin:5px 0; border:0; border-top:1px solid #eee;">
            <div><strong>Prairies :</strong> ${val}</div>
            <div><strong>Surface :</strong> ${(val * 0.8).toFixed(1)} %</div>
            <div><strong>Altitude :</strong> ${Math.floor(Math.random()*600 + 100)}m</div>
          `);
          
          // Bordure noire et mise au premier plan
          d3.select(event.currentTarget)
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .raise();
        })
        .on("mousemove", (event) => {
          // Suivi de la souris
          tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY + 15) + "px");
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("stroke", "#999").attr("stroke-width", 0.5);
        })
        .on("click", (event, d) => zoomToArr(event, d))
        .transition().duration(500).style("opacity", 1);
    }

    function zoomToArr(event, d) {
      event.stopPropagation();
      // On vient de cliquer sur un arrondissement, donc le bouton doit ramener au DÉPARTEMENT
      backButton.text("← Retour au Département");
      zoomToFeature(d, 0.9);
      arrLayer.selectAll("path").transition().duration(750).style("opacity", node => node === d ? 1 : 0.1);
    }

    function showDepartments(regionName) {
      regionsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");

      const filteredDepts = deptsData.features.filter(f => deptToRegion[f.properties.code] === regionName);
      const localMax = d3.max(filteredDepts, f => dataMap.get(f.properties.nom.trim())) || 1;
      const localScale = d3.scaleSequential().domain([0, localMax]).interpolator(d3.interpolateGreens);

      updateLegend(localMax, "Valeur par Dept");

      const depts = deptsLayer.selectAll("path").data(filteredDepts, d => d.properties.nom);

      depts.enter()
        .append("path")
        .attr("d", path)
        .style("vector-effect", "non-scaling-stroke")
        .attr("fill", d => localScale(dataMap.get(d.properties.nom.trim()) || 0))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", (event, d) => {
          const name = d.properties.nom;
          const val = dataMap.get(name.trim()) || 0;
          
          tooltip.style("opacity", 1).html(`
            <div style="font-weight:bold; font-size:15px; margin-bottom:5px;">${name}</div>
            <hr style="margin:5px 0; border:0; border-top:1px solid #eee;">
            <div><strong>Prairies :</strong> ${val}</div>
            <div><strong>Altitude :</strong> ${Math.floor(Math.random()*400 + 50)}m</div>
          `);
          
          d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 1.5).raise();
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY + 15) + "px");
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 0.5);
        })
        .on("click", (event, d) => zoomToDept(event, d))
        .transition().duration(500).style("opacity", 1);
        
      deptsLayer.selectAll("path").transition().duration(500)
        .attr("fill", d => localScale(dataMap.get(d.properties.nom.trim()) || 0))
        .style("opacity", 1).style("pointer-events", "all");
    }

    const initialScale = d3.scaleSequential().domain([0, maxValueRegions]).interpolator(d3.interpolateGreens);
    updateLegend(maxValueRegions, "Valeur par Région");

    regionsLayer.selectAll("path")
      .data(regionsData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("vector-effect", "non-scaling-stroke")
      .attr("fill", d => initialScale(dataMap.get(d.properties.nom.trim()) || 0))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        const name = d.properties.nom;
        const val = dataMap.get(name.trim()) || 0;
        tooltip.style("opacity", 1).html(`<strong>${name}</strong><br>Prairies : ${val}`);
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

  function updateLegend(maxValue, label) {
    svg.selectAll(".legend-group").remove();
    const legendG = svg.append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(25, 140)`);

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("x1", "0%").attr("y1", "100%").attr("x2", "0%").attr("y2", "0%");

    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.1, 0.1))
      .enter().append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => d3.interpolateGreens(d));

    legendG.append("rect")
      .attr("width", 20).attr("height", 150)
      .style("fill", "url(#linear-gradient)");

    const yScale = d3.scaleLinear().domain([0, maxValue]).range([150, 0]);
    const yAxis = d3.axisRight(yScale).ticks(5);
    legendG.append("g").attr("transform", `translate(20, 0)`).call(yAxis);
    legendG.append("text").attr("y", -10).style("font-size", "12px").style("font-weight", "bold").text(label);
  }
}