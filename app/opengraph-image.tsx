import { ImageResponse } from 'next/og'

export const alt = 'Werewolf — the private social deduction game for groups'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          overflow: 'hidden',
          background: '#f6f7f9',
          color: '#182033',
          fontFamily: 'Arial, Helvetica, sans-serif',
          padding: '76px 88px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-290px',
            right: '-120px',
            display: 'flex',
            width: '720px',
            height: '720px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #d9e5ff 0%, #edf3ff 52%, transparent 72%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-360px',
            left: '-190px',
            display: 'flex',
            width: '780px',
            height: '650px',
            borderRadius: '50%',
            background: '#e9eef8',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '820px' }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              border: '1px solid #ccd8ef',
              borderRadius: '999px',
              background: '#ffffffcc',
              color: '#4169ba',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '2px',
              padding: '13px 22px',
              textTransform: 'uppercase',
            }}
          >
            Private social game
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '32px',
              fontSize: '112px',
              fontWeight: 800,
              letterSpacing: '-7px',
              lineHeight: 0.92,
            }}
          >
            Werewolf
          </div>
          <div
            style={{
              display: 'flex',
              width: '760px',
              marginTop: '30px',
              color: '#657087',
              fontSize: '34px',
              lineHeight: 1.35,
            }}
          >
            Create a room. Share the code. Find the wolves before they find you.
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: '92px',
            bottom: '78px',
            display: 'flex',
            width: '128px',
            height: '128px',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d4def1',
            borderRadius: '38px',
            background: '#ffffff',
            boxShadow: '0 20px 54px #365aa62a',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '84px',
              height: '84px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '26px',
              background: 'linear-gradient(145deg, #5685eb, #315fcb)',
            }}
          >
            <svg width="68" height="68" viewBox="130 130 252 252" fill="none">
              <path
                d="M169 169.5 222.3 213A99 99 0 0 1 256 207a99 99 0 0 1 33.7 6l53.3-43.5-13.6 84.2A86 86 0 0 1 342 299c0 49.5-38.5 89-86 89s-86-39.5-86-89a86 86 0 0 1 12.6-45.3Z"
                stroke="#fff"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m209 289 26 13m68-13-26 13m-37 38c10.7 8 21.3 8 32 0M256 317v25"
                stroke="#fff"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
