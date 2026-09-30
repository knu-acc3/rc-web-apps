import { MetadataRoute } from 'next';
import { siteConfig } from '@/src/config/site.config';

export default function robots(): MetadataRoute.Robots {
  const isProductionDeployment = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.CONTEXT
      ? process.env.CONTEXT === 'production'
      : process.env.NODE_ENV === 'production';

  if (!isProductionDeployment) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/private/', '/draft/'] }],
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
  };
}
