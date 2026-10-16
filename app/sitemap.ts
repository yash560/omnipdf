import type { MetadataRoute } from 'next';
import { ALL_TOOLS } from '@/lib/tools-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://filecraft.thewebvale.com';
  const now = new Date();

  // Core high-authority routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/drive`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic routes for all 57 specialized in-browser tools
  const toolRoutes: MetadataRoute.Sitemap = ALL_TOOLS.map((tool) => ({
    url: `${baseUrl}/${tool.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: tool.popular ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
