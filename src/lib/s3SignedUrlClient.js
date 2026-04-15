import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const awsRegion = (import.meta.env.VITE_AWS_REGION || '').trim();
const awsBucket = (import.meta.env.VITE_AWS_S3_BUCKET || '').trim();
const awsAccessKeyId = (import.meta.env.VITE_AWS_ACCESS_KEY_ID || '').trim();
const awsSecretAccessKey = (import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '').trim();
const signedUrlTtlSeconds = Number(import.meta.env.VITE_AWS_S3_SIGNED_URL_TTL || 900);
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'base44_access_token';

const hasAwsClientConfig = Boolean(
  awsRegion && awsBucket && awsAccessKeyId && awsSecretAccessKey,
);

const s3Client = hasAwsClientConfig
  ? new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    })
  : null;

const signedUrlCache = new Map();

const normalizeKey = (value) => {
  if (!value || !String(value).trim()) {
    return null;
  }
  return String(value).trim().replace(/^\/+/, '');
};

const resolveApiBaseUrl = () => {
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    return apiBaseUrl;
  }

  const normalizedPath = apiBaseUrl.startsWith('/') ? apiBaseUrl : `/${apiBaseUrl}`;
  return `${window.location.origin}${normalizedPath}`;
};

const saveSignedUrlCache = (key, url, expiresInSeconds) => {
  const safeExpiresIn = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds
    : 900;

  signedUrlCache.set(key, {
    url,
    expiresAt: Date.now() + safeExpiresIn * 1000,
  });
};

const getCachedSignedUrl = (key, forceRefresh) => {
  if (forceRefresh) {
    return null;
  }

  const now = Date.now();
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > now + 30_000) {
    return cached.url;
  }

  return null;
};

const safeParse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const getSignedUrlFromBackend = async (key) => {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const response = await fetch(
      `${resolveApiBaseUrl()}/upload/signed-url?key=${encodeURIComponent(key)}`,
      {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    );

    const data = await safeParse(response);

    if (!response.ok || !data?.url) {
      return null;
    }

    saveSignedUrlCache(key, data.url, data.expiresInSeconds ?? signedUrlTtlSeconds);
    return data.url;
  } catch {
    return null;
  }
};

export const extractS3KeyFromUrl = (rawUrl) => {
  if (!rawUrl || !String(rawUrl).trim()) {
    return null;
  }

  const trimmed = String(rawUrl).trim();

  if (trimmed.startsWith('/')) {
    try {
      const localUrl = new URL(`https://local.restitua${trimmed}`);
      return normalizeKey(localUrl.searchParams.get('key'));
    } catch {
      return null;
    }
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const keyFromQuery = normalizeKey(parsed.searchParams.get('key'));
  if (keyFromQuery) {
    return keyFromQuery;
  }

  const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  if (!pathname) {
    return null;
  }

  if (
    awsBucket &&
    (parsed.hostname === `${awsBucket}.s3.amazonaws.com` ||
      parsed.hostname.startsWith(`${awsBucket}.s3.`))
  ) {
    return normalizeKey(pathname);
  }

  if (
    awsBucket &&
    (parsed.hostname === 's3.amazonaws.com' || parsed.hostname.startsWith('s3.')) &&
    pathname.startsWith(`${awsBucket}/`)
  ) {
    return normalizeKey(pathname.slice(awsBucket.length + 1));
  }

  if (pathname.startsWith('uploads/')) {
    return normalizeKey(pathname);
  }

  return null;
};

export const resignS3UrlOnClient = async (originalUrl, forceRefresh = false) => {
  const key = extractS3KeyFromUrl(originalUrl);
  if (!key) {
    return null;
  }

  const cached = getCachedSignedUrl(key, forceRefresh);
  if (cached) {
    return cached;
  }

  if (!s3Client) {
    return getSignedUrlFromBackend(key);
  }

  const expiresIn = Number.isFinite(signedUrlTtlSeconds) && signedUrlTtlSeconds > 0
    ? signedUrlTtlSeconds
    : 900;

  try {
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: awsBucket,
        Key: key,
      }),
      { expiresIn },
    );

    saveSignedUrlCache(key, url, expiresIn);
    return url;
  } catch {
    return getSignedUrlFromBackend(key);
  }
};
