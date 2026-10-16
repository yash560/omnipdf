import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/drive/vault/'],
    },
    sitemap: 'https://filecraft.thewebvale.com/sitemap.xml',
  };
}
