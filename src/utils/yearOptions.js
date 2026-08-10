const YEARS_BACK_FROM_CURRENT = 7;

function getYearFromNota(nota) {
  const year = Number(String(nota?.data_emissao || '').slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function getYearRange(yearsBack) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack + 1 }, (_, index) => currentYear - index);
}

export function getVisibleYearOptions(_userOrIsPremium, notas = []) {
  const yearsFromNotas = notas.map(getYearFromNota).filter(Boolean);
  const years = new Set([...getYearRange(YEARS_BACK_FROM_CURRENT), ...yearsFromNotas]);
  return Array.from(years).sort((a, b) => b - a);
}

export function filterNotasByVisibleHistory(notas, _userOrIsPremium) {
  return notas;
}
