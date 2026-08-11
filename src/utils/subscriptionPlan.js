export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
};

export function getSubscriptionTier(userOrIsPremium) {
  if (typeof userOrIsPremium === 'boolean') {
    return userOrIsPremium ? SUBSCRIPTION_TIERS.PREMIUM : SUBSCRIPTION_TIERS.FREE;
  }

  const user = userOrIsPremium || {};
  if (!user.isPremium) {
    return SUBSCRIPTION_TIERS.FREE;
  }

  if (user.premiumExpiresAt) {
    const expiresAt = new Date(user.premiumExpiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date()) {
      return SUBSCRIPTION_TIERS.FREE;
    }
  }

  const plan = String(user.premiumPlan || '').toLowerCase();
  return plan === SUBSCRIPTION_TIERS.BASIC ? SUBSCRIPTION_TIERS.BASIC : SUBSCRIPTION_TIERS.PREMIUM;
}

export function hasBasicAccess(userOrIsPremium) {
  return [SUBSCRIPTION_TIERS.BASIC, SUBSCRIPTION_TIERS.PREMIUM].includes(getSubscriptionTier(userOrIsPremium));
}

export function hasPremiumAccess(userOrIsPremium) {
  return getSubscriptionTier(userOrIsPremium) === SUBSCRIPTION_TIERS.PREMIUM;
}

export function isFreeYearLocked(userOrIsPremium, year) {
  if (getSubscriptionTier(userOrIsPremium) !== SUBSCRIPTION_TIERS.FREE) {
    return false;
  }

  const currentYear = new Date().getFullYear();
  return Number(year) < currentYear - 1;
}

export function canDownloadIndividualNota(userOrIsPremium, nota) {
  if (hasBasicAccess(userOrIsPremium)) {
    return true;
  }

  const createdAt = nota?.createdAt || nota?.created_date;
  if (!createdAt) {
    return false;
  }

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return false;
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  return createdDate >= startDate;
}

export function getSubscriptionLabel(userOrIsPremium) {
  const tier = getSubscriptionTier(userOrIsPremium);

  if (tier === SUBSCRIPTION_TIERS.BASIC) {
    return 'Plano Basic';
  }

  if (tier === SUBSCRIPTION_TIERS.PREMIUM) {
    return 'Plano Premium';
  }

  return 'Plano Gratuito';
}
