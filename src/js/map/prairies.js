import proj4 from "proj4";

export function afficherPrairies(svg, allParcelles, currentArrData, path, arrLayer) {
  console.log("Affichage des prairies pour l'arrondissement :", currentArrData ? currentArrData.properties.nom : "Aucun arrondissement sélectionné");
  // Supprimer les anciennes parcelles
  svg.selectAll(".prairie-layer").remove();
  const prairieLayer = arrLayer.append("g").attr("class", "prairie-layer");

  if (!currentArrData) return; // si aucun arrondissement sélectionné, rien à afficher

  // Filtrer les parcelles qui sont dans l'arrondissement courant
  const arrCode = currentArrData.properties.code;
  const parcellesFiltrees = allParcelles.filter(p => p.arr_parc.startsWith(arrCode));
  console.log(`Nombre de parcelles à afficher : ${parcellesFiltrees.length}`);
  console.log(`Ex parcelle à afficher : ${JSON.stringify(parcellesFiltrees[0])}`);

  // Ajouter les chemins
  
  prairieLayer.selectAll("path")
  .data(parcellesFiltrees, d => d.id_parcel)
  .join("path")
  .attr("d", d => {
      // Convert WKT string to coordinates
      const coords = wktToCoords(d.geometry);

      // Build a GeoJSON polygon object
      const geojson = {
        type: "Polygon",
        coordinates: [coords] // D3 expects [ [ [x, y], ... ] ] for polygons
      };

      // Use D3 geoPath with your projection
      return path(geojson);
    })
    .attr("fill", "rgba(34,139,34,0.5)")
    .attr("stroke", "#006400")
    .attr("stroke-width", 0.3);

  console.log("Prairie paths count:", prairieLayer.selectAll("path").size());
}

// Simple SVG path from WKT coordinates (no projection)
function wktToSvgPath(wkt) {
  const coordsText = wkt.slice(9, -2).trim(); // remove "POLYGON ((" and "))"
  const coords = coordsText.split(",").map(pt => pt.trim().split(" ").map(Number));
  return "M" + coords.map(c => c.join(",")).join("L") + "Z";
}

const lambert93 = "+proj=lcc +lat_1=44 +lat_2=49 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs";
const wgs84 = proj4.WGS84;

function wktToCoords(wkt) {
  let coordsText = wkt.replace(/^POLYGON\s*\(\(/i, "").replace(/\)\)$/, "").trim();

  return coordsText.split(",").map(pt => {
    const [x, y] = pt.trim().split(/\s+/).map(Number);

    // reprojection Lambert93 -> WGS84
    const [lon, lat] = proj4(lambert93, wgs84, [x, y]);

    return [lon, lat];
  });
}