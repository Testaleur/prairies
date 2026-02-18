import { regCodeToName, deptCodeToName } from "../config.js";

// --- FONCTION DE TRAITEMENT DES DONNÉES ---
export function processData(allParcelles, filterValue ) {
  const dataMap = new Map();
  const filtered = filterValue === "ALL"
    ? allParcelles
    : allParcelles.filter(p => p.CODE_CULTU === filterValue);

  filtered.forEach(p => {
    const regCode = String(p.reg_parc || '').trim().split('.')[0];
    const deptCode = String(p.dep_parc || '').trim().padStart(2, '0');
    const arrCode = String(p.arr_parc || '').trim().padStart(3, '0');
    const regName = regCodeToName[regCode];
    const deptName = deptCodeToName[deptCode];
    const alt = +p.alt_mean || 0;
    const surf = +p.SURF_PARC || 0;

    updateStats(dataMap, regName, alt, surf);
    updateStats(dataMap, deptName, alt, surf);
    updateStats(dataMap, arrCode, alt, surf);
  });

  dataMap.forEach(v => v.avgAlt = v.count ? Math.round(v.sumAlt / v.count) : 0);

  return dataMap;
}

function updateStats(dataMap, name, alt, surf) {
  if (!name) return;
  if (!dataMap.has(name)) dataMap.set(name, { count: 0, sumAlt: 0, surface: 0 });
  const s = dataMap.get(name);
  s.count++;
  s.sumAlt += alt;
  s.surface += Math.round(surf);
};