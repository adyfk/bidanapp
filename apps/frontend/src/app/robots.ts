import { MetadataRoute } from 'next';
import { APP_CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${APP_CONFIG.baseUrl}/sitemap.xml`,
  };
}
