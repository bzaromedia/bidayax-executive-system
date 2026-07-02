type ExecutiveBrandMarkProps = {
  readonly className?: string;
};

export function ExecutiveBrandMark({ className }: ExecutiveBrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="8"
        y="8"
        width="80"
        height="80"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M28 34h40M48 34v28M31 62h34"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}
