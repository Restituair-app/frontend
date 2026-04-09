import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const awsRegion = (import.meta.env.VITE_AWS_REGION || '').trim();
const awsBucket = (import.meta.env.VITE_AWS_S3_BUCKET || '').trim();
const awsAccessKeyId = (import.meta.env.VITE_AWS_ACCESS_KEY_ID || '').trim();
const awsSecretAccessKey = (import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '').trim();
const signedUrlTtlSeconds = Number(import.meta.env.VITE_AWS_S3_SIGNED_URL_TTL || 900);

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
  if (!s3Client) {
    return null;
  }

  const key = extractS3KeyFromUrl(originalUrl);
  if (!key) {
    return null;
  }

  const now = Date.now();
  const cached = signedUrlCache.get(key);
  if (!forceRefresh && cached && cached.expiresAt > now + 30_000) {
    return cached.url;
  }

  const expiresIn = Number.isFinite(signedUrlTtlSeconds) && signedUrlTtlSeconds > 0
    ? signedUrlTtlSeconds
    : 900;

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: awsBucket,
      Key: key,
    }),
    { expiresIn },
  );

  signedUrlCache.set(key, {
    url,
    expiresAt: now + expiresIn * 1000,
  });

  return url;
};
