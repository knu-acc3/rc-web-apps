import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { siteConfig } from '@/src/config/site.config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || siteConfig.brandName;
    const category = searchParams.get('category') || 'Online Tools';

    const fontSize = title.length > 50 ? 44 : title.length > 25 ? 54 : 64;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 80px',
            backgroundColor: '#0b0f19',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              {siteConfig.brandShort}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                {siteConfig.brandName}
              </span>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                {category}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-1px',
                maxWidth: '960px',
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #1e293b',
              paddingTop: '24px',
              fontSize: '18px',
              color: '#64748b',
            }}
          >
            <span>{siteConfig.domain}</span>
            <span>Free & Private Client-Side Tools</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, immutable, no-transform, max-age=31536000',
        },
      }
    );
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'OG generation failed';
    return new Response(`Failed to generate the image: ${errorMsg}`, {
      status: 500,
    });
  }
}
