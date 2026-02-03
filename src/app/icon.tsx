import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        background: '#0a0a0c',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <path
          d="M60 15 C30 15 15 35 15 52 C15 68 28 82 45 85 L47 92 L53 92 L53 85 C56 86 64 86 67 85 L67 92 L73 92 L75 85 C92 82 105 68 105 52 C105 35 90 15 60 15Z"
          fill="#00e5ff"
        />
        {/* Left Cybernetic Claw */}
        <path d="M18 48 L5 38 L0 44 L10 52 L0 62 L5 68 L18 58 Z" fill="#00e5ff" />
        {/* Right Cybernetic Claw */}
        <path d="M102 48 L115 38 L120 44 L110 52 L120 62 L115 68 L102 58 Z" fill="#00e5ff" />
        {/* Eyes */}
        <circle cx="42" cy="38" r="7" fill="#0a0a0c" />
        <circle cx="78" cy="38" r="7" fill="#0a0a0c" />
        <circle cx="44" cy="37" r="3" fill="#f5fbff" />
        <circle cx="80" cy="37" r="3" fill="#f5fbff" />
        {/* Mouth - focused */}
        <line
          x1="52"
          y1="55"
          x2="68"
          y2="55"
          stroke="#0a0a0c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Laptop hint */}
        <rect x="38" y="90" width="44" height="16" rx="1" fill="#1a1a22" />
      </svg>
    </div>,
    {
      ...size,
    }
  );
}
