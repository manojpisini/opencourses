import type { APIRoute } from 'astro';
import OC from '../data/oc';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://opencourses-org.github.io').replace(/\/$/, '');

  const staticPages = ['', '/courses', '/tracks', '/contributors', '/changelog', '/about'];
  const coursePages = OC.COURSES.map(c => `/courses/${c.slug}`);
  const contributorPages = OC.CONTRIBUTORS.map(c => `/contributors/${c.login}`);

  const urls = [...staticPages, ...coursePages, ...contributorPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(path => `  <url>\n    <loc>${base}${path}</loc>\n  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
