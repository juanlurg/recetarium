import { NextRequest, NextResponse } from 'next/server';
import instagramGetUrl from 'instagram-url-direct';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('instagram.com')) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL' },
        { status: 400 }
      );
    }

    // Get direct video URL
    const result = await instagramGetUrl(url);

    if (!result || !result.url_list || result.url_list.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract video URL. The reel may be private or the URL invalid.' },
        { status: 400 }
      );
    }

    // Return the first video URL
    const videoUrl = result.url_list[0];

    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error('Instagram download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video. Instagram may have blocked the request.' },
      { status: 500 }
    );
  }
}
