type ExecutiveBrandMarkProps = {
  readonly className?: string;
};

export function ExecutiveBrandMark({ className }: ExecutiveBrandMarkProps) {
  return (
    <img
      alt=""
      className={className}
      decoding="async"
      src="/brand/the-executive-card-logo-mark.png"
    />
  );
}
