import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/dashboard/', '/builder/', '/resume/', '/checkout/', '/career-roadmap'] }, sitemap: 'https://www.firstcareersteps.com/sitemap.xml' };
}
