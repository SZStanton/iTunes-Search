// Every button in the app is one of these four. A one-off string of utilities
// is how a hover ends up without its active, or a focus ring goes missing
const variants = {
  primary:
    'bg-accent-strong text-accent-ink hover:brightness-110 active:brightness-95',
  secondary:
    'border border-line bg-surface text-ink hover:border-accent-strong hover:bg-raised active:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-ink active:bg-raised',
  danger:
    'text-muted hover:bg-danger-surface hover:text-danger active:bg-danger-surface active:text-danger',
};

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-1.5 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

function Button({
  variant = 'secondary',
  size = 'md',
  full = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`type-chrome focus-ring inline-flex items-center justify-center gap-2 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
