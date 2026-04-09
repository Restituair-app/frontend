import { useEffect, useState } from 'react';

import { resignS3UrlOnClient } from '@/lib/s3SignedUrlClient';

export default function ResignedImage({ src, alt, className }) {
  const [resolvedSrc, setResolvedSrc] = useState(src || '');

  useEffect(() => {
    let mounted = true;
    setResolvedSrc(src || '');

    if (!src) {
      return () => {
        mounted = false;
      };
    }

    resignS3UrlOnClient(src)
      .then((nextUrl) => {
        if (mounted && nextUrl) {
          setResolvedSrc(nextUrl);
        }
      })
      .catch(() => {
        // no-op
      });

    return () => {
      mounted = false;
    };
  }, [src]);

  if (!src) {
    return null;
  }

  return (
    <img
      src={resolvedSrc || src}
      alt={alt}
      className={className}
      onError={async () => {
        const candidate = resolvedSrc || src;
        const refreshed = await resignS3UrlOnClient(candidate, true);
        if (refreshed) {
          setResolvedSrc(refreshed);
        }
      }}
    />
  );
}
