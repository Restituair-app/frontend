import { getSubscriptionTier, SUBSCRIPTION_TIERS } from '@/utils/subscriptionPlan';

const DEFAULT_MIN_YEAR = 2022;
const FREE_HISTORY_YEARS = 1;
const BASIC_HISTORY_YEARS = 5;

function getYearFromNota(nota) {
  const year = Number(String(nota?.data_emissao || '').slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function getYearRange(yearsBack) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack }, (_, index) => currentYear - index);
}

export function getVisibleYearOptions(userOrIsPremium, notas = []) {
  const tier = getSubscriptionTier(userOrIsPremium);

  if (tier === SUBSCRIPTION_TIERS.PREMIUM) {
    const yearsFromNotas = notas.map(getYearFromNota).filter(Boolean);
    const years = new Set([new Date().getFullYear(), ...yearsFromNotas]);
    return Array.from(years).sort((a, b) => b - a);
  }

  if (tier === SUBSCRIPTION_TIERS.BASIC) {
    return getYearRange(BASIC_HISTORY_YEARS).filter((year) => year >= DEFAULT_MIN_YEAR);
  }

  return getYearRange(FREE_HISTORY_YEARS + 1).filter((year) => year >= DEFAULT_MIN_YEAR);
}

export function getHistoryStartDate(userOrIsPremium) {
  const tier = getSubscriptionTier(userOrIsPremium);

  if (tier === SUBSCRIPTION_TIERS.PREMIUM) {
    return null;
  }

  const start = new Date();
  start.setFullYear(start.getFullYear() - (tier === SUBSCRIPTION_TIERS.BASIC ? BASIC_HISTORY_YEARS : FREE_HISTORY_YEARS));
  return start;
}

export function filterNotasByVisibleHistory(notas, userOrIsPremium) {
  const start = getHistoryStartDate(userOrIsPremium);
  if (!start) {
    return notas;
  }

  return notas.filter((nota) => {
    const createdAt = nota.createdAt || nota.created_date;
    if (!createdAt) {
      return false;
    }

    const createdDate = new Date(createdAt);
    return Number.isFinite(createdDate.getTime()) && createdDate >= start;
  });
}
