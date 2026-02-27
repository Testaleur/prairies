import proj4 from "proj4";

export function afficherPrairies(svg, allParcelles, currentArrData, path, arrLayer) {
  console.log("Affichage des prairies pour l'arrondissement :", currentArrData ? currentArrData.properties.nom : "Aucun arrondissement sélectionné");
  // Supprimer les anciennes parcelles
  svg.selectAll(".prairie-layer").remove();
  const prairieLayer = arrLayer.append("g").attr("class", "prairie-layer");

  if (!currentArrData) return; // si aucun arrondissement sélectionné, rien à afficher

  // Filtrer les parcelles qui sont dans l'arrondissement courant
  const arrCode = currentArrData.properties.code;
  var parcellesFiltrees = allParcelles.filter(p => p.arr_parc.startsWith(arrCode));
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
    .attr("stroke-width", 0.3)
    .on("click", (event, d) => {
      console.log("Clicked parcel id:", d.id_parcel);
      event.stopPropagation();
    });

  console.log("Prairie paths count:", prairieLayer.selectAll("path").size());
}

const lambert93 = "+proj=lcc +lat_1=44 +lat_2=49 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs";
const wgs84 = proj4.WGS84;

function wktToCoords(wkt) {
  let coordsText = wkt.replace(/^POLYGON\s*\(\(/i, "").replace(/\)\)$/, "").trim();

  return coordsText
    .split(",")
    .map(pt => {
      const clean = pt.replace(/[()]/g, "").trim();

      const [x, y] = clean.split(/\s+/).map(Number);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn("Coordonnées invalides dans WKT :", pt);
        return null;
      }

      if(!isValidLambert93([x, y])) {
        console.warn("Coordonnées hors de la zone Lambert93 attendue :", [x, y]);
        return null;
      }

      // reprojection Lambert93 -> WGS84
      const [lon, lat] = proj4(lambert93, wgs84, [x, y]);

      return [lon, lat];
    })
    .filter(Boolean);
}

const MAX_LAMBERT93 = 1300000;  // X max ~1,300,000
const MIN_LAMBERT93 = -100000; // safe margin
const MIN_Y = 6000000;         // France south ~6,100,000
const MAX_Y = 7200000;         // France north ~7,200,000

function isValidLambert93([x, y]) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x > MIN_LAMBERT93 && x < MAX_LAMBERT93 &&
    y > MIN_Y && y < MAX_Y
  );
}