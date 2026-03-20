import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PLIC - 카드로 송금하다';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            PLIC
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 600,
              color: '#bfdbfe',
            }}
          >
            카드로 송금하다
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '20px',
            }}
          >
            {['결제일까지 여유', '원금 100% 송금', '카드 혜택 그대로'].map((text) => (
              <div
                key={text}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '50px',
                  fontSize: '20px',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                {text}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#93c5fd',
              marginTop: '16px',
            }}
          >
            www.plic.kr
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
