const tones = {
  accent: 'bg-accent-strong text-accent-ink',
  quiet: 'bg-raised text-muted',
};

// A count or a short label riding on something else. Never on its own
function Badge({ tone = 'accent', className = '', children }) {
  return (
    <span
      className={`type-chrome inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-2xs tabular-nums ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
