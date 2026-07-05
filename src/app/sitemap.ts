import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';
import { TOOLS } from '@/lib/tools';
import { COMPETITORS } from '@/lib/compare';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ['', '/about', '/pricing', '/guide', '/contact', '/compare'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));
  const toolRoutes = TOOLS.map((t) => ({
    url: `${siteUrl}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: t.featured ? 0.8 : 0.6,
  }));
  const compareRoutes = COMPETITORS.map((c) => ({
    url: `${siteUrl}/compare/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  const legal = ['/privacy', '/terms'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }));
  return [...staticRoutes, ...toolRoutes, ...compareRoutes, ...legal];
}
