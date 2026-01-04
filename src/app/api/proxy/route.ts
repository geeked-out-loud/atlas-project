import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);
    const allowedDomains = ['www.reddit.com', 'newsapi.org', 'api.themoviedb.org'];
    
    if (!allowedDomains.includes(targetUrl.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AtlasBot/1.0; +https://atlas-dashboard.app)',
        'Accept': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ 
        error: `API returned ${response.status}`,
        details: text.slice(0, 200)
      }, { status: response.status });
    }

    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      return NextResponse.json({ 
        error: 'Invalid response format',
        details: `Expected JSON, got ${contentType}`,
        preview: text.slice(0, 200)
      }, { status: 502 });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

