import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';

// Allow every crawler on the public site (search engines are explicitly welcome
// for SEO). Only private/app surfaces are disallowed. The bot blocker never
// touches these paths for known search engines — see middleware.ts.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account', '/api/', '/app/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
