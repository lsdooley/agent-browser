export default function RobotIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Antenna stem */}
      <rect x="22" y="3" width="4" height="7" rx="2" fill="#818cf8"/>
      {/* Antenna ball */}
      <circle cx="24" cy="3" r="3" fill="#a78bfa"/>

      {/* Head */}
      <rect x="5" y="10" width="38" height="30" rx="7" fill="#4f46e5"/>
      <rect x="5" y="10" width="38" height="15" rx="7" fill="#6366f1" opacity="0.5"/>

      {/* Eye housings */}
      <rect x="9"  y="15" width="13" height="13" rx="4" fill="#1e1b4b"/>
      <rect x="26" y="15" width="13" height="13" rx="4" fill="#1e1b4b"/>

      {/* Eyes */}
      <circle cx="15.5" cy="21.5" r="4.5" fill="#06b6d4"/>
      <circle cx="32.5" cy="21.5" r="4.5" fill="#06b6d4"/>

      {/* Eye highlights */}
      <circle cx="17"   cy="19.5" r="1.8" fill="white" opacity="0.85"/>
      <circle cx="34"   cy="19.5" r="1.8" fill="white" opacity="0.85"/>

      {/* Smile */}
      <path d="M15 34 Q24 40 33 34"
            stroke="#a5b4fc" strokeWidth="2.2"
            fill="none" strokeLinecap="round"/>

      {/* Indicator lights */}
      <circle cx="20" cy="36" r="1.2" fill="#34d399"/>
      <circle cx="24" cy="36" r="1.2" fill="#fbbf24"/>
      <circle cx="28" cy="36" r="1.2" fill="#f87171"/>
    </svg>
  );
}
