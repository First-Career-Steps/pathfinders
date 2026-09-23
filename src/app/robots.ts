import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/', '/builder/', '/checkout/'] },
    sitemap: 'https://www.firstcareersteps.com/sitemap.xml',
  };
}
