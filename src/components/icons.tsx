//색은 부모의 color(currentColor)를 따르는 단색 라인 아이콘
const ICON_STROKE_WIDTH = 1.8

const LineIcon = ({ size, children }: { size: number; children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={ICON_STROKE_WIDTH}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const PhotoIcon = ({ size = 24 }: { size?: number }) => (
  <LineIcon size={size}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M21 16l-5-5-8 9" />
  </LineIcon>
)

export const CameraIcon = ({ size = 24 }: { size?: number }) => (
  <LineIcon size={size}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </LineIcon>
)

export const SmileIcon = ({ size = 24 }: { size?: number }) => (
  <LineIcon size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" />
    <path d="M9 9.5h.01M15 9.5h.01" />
  </LineIcon>
)

export const SmilePlusIcon = ({ size = 24 }: { size?: number }) => (
  <LineIcon size={size}>
    <path d="M22 11v1a10 10 0 1 1-9-10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9h.01M15 9h.01" />
    <path d="M16 5h6M19 2v6" />
  </LineIcon>
)

//ㄴ> 모양의 답장 아이콘
export const ReplyIcon = ({ size = 24 }: { size?: number }) => (
  <LineIcon size={size}>
    <path d="M5 4v9a2 2 0 0 0 2 2h12" />
    <path d="M15 11l4 4-4 4" />
  </LineIcon>
)
