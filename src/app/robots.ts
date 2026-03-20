import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/payment/'],
      },
    ],
    sitemap: 'https://www.plic.kr/sitemap.xml',
  };
}
