import type { MetadataRoute } from 'next';

import { classes } from '@/lib/classes/catalog';
import { courseFiles } from '@/lib/education/catalog';
import { WORKSHOP } from '@/lib/workshop';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '',
    '/learn',
    ...Object.keys(courseFiles)
      .filter(course => !course.endsWith('/fieldbook'))
      .map(course => '/learn/' + course),
    '/resume-builder',
    '/for-educators',
    WORKSHOP,
    '/classes',
    ...classes.map(course => '/classes/' + course.slug),
    '/privacy',
    '/terms',
  ];
  return pages.map(path => ({
    url: `https://www.firstcareersteps.com${path}`,
    changeFrequency: 'monthly',
    priority: path ? 0.7 : 1,
  }));
}
