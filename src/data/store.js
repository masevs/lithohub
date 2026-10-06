// User-entered data is kept in the browser (localStorage), separate from the
// paper data. It never overwrites public/data/assets.json.
// To move to a real backend later, replace loadUserData/saveUserData only.
import { setPath } from './schemas.js';

const KEY = 'lithohub:userdata:v1';

export function loadUserData() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserData(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// Returns the asset to diagnose: paper data, or a copy with the user's tables swapped in.
export function resolveAsset(well, wellId, userData, useUserData) {
  const base = well.asset;
  const entry = userData[wellId];
  if (!useUserData || !entry || !entry.tables) return base;
  const copy = structuredClone(base);
  Object.entries(entry.tables).forEach(([path, rows]) => setPath(copy, path, rows));
  return copy;
}
