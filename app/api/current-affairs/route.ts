import { NextResponse } from 'next/server';

type NewsItem = { category: string; date: string; title: string; url: string };

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export async function GET() {
  try {
    const res = await fetch('https://www.tnpscthervupettagam.com/currentaffairs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('fetch failed');
    const html = await res.text();

    const items: NewsItem[] = [];
    const blockRegex = /<div class="row\s+list-part[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(html)) !== null && items.length < 15) {
      const block = blockMatch[1];
      const catMatch = block.match(/<a class="tgs-btn[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/);
      const category = catMatch ? catMatch[1].trim() : 'Current Affairs';
      const titleMatch = block.match(/<h3>\s*([\s\S]*?)\s*<\/h3>/);
      if (!titleMatch) continue;
      const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      if (!title || title.length < 5) continue;
      const dateMatch = block.match(/<span class="calendar">[\s\S]*?<\/i>\s*([^<]+?)\s*<\/span>/);
      const rawDate = dateMatch ? dateMatch[1].trim() : '';
      const slug = slugify(title);
      const url = `https://www.tnpscthervupettagam.com/currentaffairs-detail/${slug}`;
      items.push({ category, date: rawDate, title, url });
    }

    if (items.length === 0) return NextResponse.json({ items: [], source: 'empty' });
    return NextResponse.json({ items, source: 'live' });
  } catch (err) {
    console.error('CA scrape failed:', err);
    return NextResponse.json({ items: [], source: 'error' });
  }
}