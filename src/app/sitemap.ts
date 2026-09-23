import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/resume-builder', '/for-educators'].map((path) => ({
    url: `https://www.firstcareersteps.com${path}`,
    changeFrequency: 'monthly',
    priority: path ? 0.7 : 1,
  }));
}
