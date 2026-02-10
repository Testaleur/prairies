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

  const regCodeToName = {
    "84": "Auvergne-Rhône-Alpes", "27": "Bourgogne-Franche-Comté", "53": "Bretagne", 
    "24": "Centre-Val de Loire", "94": "Corse", "44": "Grand Est", "32": "Hauts-de-France", 
    "11": "Île-de-France", "28": "Normandie", "75": "Nouvelle-Aquitaine", 
    "76": "Occitanie", "52": "Pays de la Loire", "93": "Provence-Alpes-Côte d'Azur"
};

const deptCodeToName = {
    "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube", "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal", "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud", "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne", "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère", "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault", "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura", "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique", "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire", "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle", "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord", "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques", "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône", "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie", "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse", "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne", "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise"
};

  let currentRegionData = null;
  let currentDeptData = null;

  Promise.all([
    d3.json(`${BASE_URL}regions.geojson`),
    d3.json(`${BASE_URL}departements.geojson`),
    d3.json(`${BASE_URL}arrondissements.geojson`),
    d3.csv(`${BASE_URL}rhone.csv`)
  ]).then(([regionsData, deptsData, arrData, rhoneData]) => {

  // --- AGRÉGATION DES DONNÉES ---
const dataMap = new Map();

rhoneData.forEach(p => {
    // Conversion des codes avec gestion robuste
    const regCode = String(p.reg_parc || '').trim().split('.')[0]; // "84.0" -> "84"
    const deptCode = String(p.dep_parc || '').trim().padStart(2, '0'); // "69" ou "1" -> "69" ou "01"
    
    const regName = regCodeToName[regCode];
    const deptName = deptCodeToName[deptCode];
    
    const alt = +p.alt_mean || 0;
    const surf = +p.SURF_PARC || 0;

    const updateStats = (name) => {
        if (!name) return;
        if (!dataMap.has(name)) {
            dataMap.set(name, { count: 0, sumAlt: 0, sumSurf: 0 });
        }
        const s = dataMap.get(name);
        s.count += 1;
        s.sumAlt += alt;
        s.sumSurf += surf;
    };

    updateStats(regName);
    updateStats(deptName);
});

// Calcul des moyennes
dataMap.forEach(v => {
    v.avgAlt = v.count > 0 ? Math.round(v.sumAlt / v.count) : 0;
});

// DEBUG: Afficher les données agrégées
console.log("=== DONNÉES AGRÉGÉES ===");
dataMap.forEach((value, key) => {
    console.log(`${key}: ${value.count} prairies, alt moyenne: ${value.avgAlt}m`);
});

    const regionsNames = regionsData.features.map(f => f.properties.nom.trim());
    // Corrigé : on cherche le max du champ .count
    const maxValueRegions = d3.max(regionsNames, name => dataMap.get(name)?.count) || 100;
  
    console.log("Max value regions:", maxValueRegions);
    console.log("Regions names from GeoJSON:", regionsNames);

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
      // On vient de cliquer sur un département, donc le bouton doit ramener à la RÉGION
      backButton.text("← Retour à la Région");
      zoomToFeature(d, 0.8);
      showArrondissements(d.properties.code);
    }

    function showArrondissements(deptCode) {
      deptsLayer.selectAll("path").transition().duration(500).style("opacity", 0).style("pointer-events", "none");

      const filteredArr = arrData.features.filter(f => f.properties.code.startsWith(deptCode));
      const localMax = d3.max(filteredArr, f => dataMap.get(f.properties.nom.trim())?.count) || 1;
      const localScale = d3.scaleSequential().domain([0, localMax]).interpolator(d3.interpolateGreens);

      updateLegend(localMax, "Valeur par Arrond.");

      const arr = arrLayer.selectAll("path").data(filteredArr, d => d.properties.nom);

      arr.enter()
        .append("path")
        .attr("d", path)
        .style("vector-effect", "non-scaling-stroke")
        .attr("fill", d => localScale(dataMap.get(d.properties.nom.trim())?.count || 0))
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", (event, d) => {
          const name = d.properties.nom;
          const stats = dataMap.get(name.trim());
          
          // Tooltip riche
          tooltip.style("opacity", 1).html(`
          <div style="font-weight:bold; font-size:15px;">${name}</div>
          <hr>
          <div><strong>Nombre de prairies :</strong> ${stats ? stats.count : 0}</div>
          <div><strong>Altitude moyenne :</strong> ${stats ? stats.avgAlt : 0} m</div>
          <div><strong>Surface totale :</strong> ${stats ? Math.round(stats.sumSurf) : 0} ha</div>
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
      const localMax = d3.max(filteredDepts, f => dataMap.get(f.properties.nom.trim())?.count) || 1;
      const localScale = d3.scaleSequential().domain([0, localMax]).interpolator(d3.interpolateGreens);

      updateLegend(localMax, "Valeur par Dept");

      const depts = deptsLayer.selectAll("path").data(filteredDepts, d => d.properties.nom);

      depts.enter()
        .append("path")
        .attr("d", path)
        .style("vector-effect", "non-scaling-stroke")
        .attr("fill", d => localScale(dataMap.get(d.properties.nom.trim())?.count || 0))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("opacity", 0)
        .on("mouseover", (event, d) => {
          const name = d.properties.nom;
          const stats = dataMap.get(name.trim());
  
          tooltip.style("opacity", 1).html(`
          <div style="font-weight:bold; font-size:15px;">${name}</div>
          <hr>
          <div><strong>Nombre de prairies :</strong> ${stats ? stats.count : 0}</div>
          <div><strong>Altitude moyenne :</strong> ${stats ? stats.avgAlt : 0} m</div>
          <div><strong>Surface totale :</strong> ${stats ? Math.round(stats.sumSurf) : 0} ha</div>
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
        .attr("fill", d => localScale(dataMap.get(d.properties.nom.trim())?.count || 0))
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
      .attr("fill", d => {
        const name = d.properties.nom.trim();
        const stats = dataMap.get(name);
        const count = stats?.count || 0;
        console.log(`Région: ${name}, count: ${count}, color: ${initialScale(count)}`);
        return initialScale(count);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        const name = d.properties.nom;
        const stats = dataMap.get(name.trim());
        
        tooltip.style("opacity", 1);
        tooltip.html(`
            <strong>Région :</strong> ${name}<br/>
            <strong>Nombre de parcelles :</strong> ${stats ? stats.count : 0}<br/>
            <strong>Altitude moy. :</strong> ${stats ? stats.avgAlt : 0} m
        `);

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