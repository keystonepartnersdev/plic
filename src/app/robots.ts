import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/payment/'],
      },
      {
        // 네이버 크롤러 명시적 허용
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/api/', '/admin/', '/payment/'],
      },
    ],
    sitemap: 'https://www.plic.kr/sitemap.xml',
    host: 'https://www.plic.kr',
  };
}
