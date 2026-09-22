import {
  INFO_PAGE_IDS,
  SITE_ORIGIN,
  infoPath,
  songPath,
  type SongLike,
} from '../src/utils/portalRouting';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export function buildSitemapXml(songs: SongLike[], lastmod = new Date().toISOString().slice(0, 10)): string {
  const entries = [
    urlEntry(`${SITE_ORIGIN}/`, lastmod, 'daily', '1.0'),
    ...INFO_PAGE_IDS.map((page) =>
      urlEntry(`${SITE_ORIGIN}${infoPath(page)}`, lastmod, 'monthly', '0.4')
    ),
    ...songs.map((song) =>
      urlEntry(`${SITE_ORIGIN}${songPath(song)}`, lastmod, 'weekly', '0.8')
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  let songs: SongLike[] = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/morfeus_songs?select=id,title,artist&order=id.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) songs = data;
      }
    } catch {
      songs = [];
    }
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(buildSitemapXml(songs));
}
