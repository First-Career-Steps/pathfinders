import type { MetadataRoute } from 'next';

import { courseFiles } from '@/lib/education/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/learn', ...Object.keys(courseFiles).filter(course => !course.endsWith('/fieldbook')).map(course => '/learn/' + course), '/resume-builder', '/for-educators', '/workshops/resume-bullet'].map((path) => ({
    url: `https://www.firstcareersteps.com${path}`,
    changeFrequency: 'monthly',
    priority: path ? 0.7 : 1,
  }));
}
