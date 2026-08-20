const variants = {
  ghost: 'text-muted hover:bg-raised hover:text-ink active:bg-raised',
  danger:
    'text-muted hover:bg-danger-surface hover:text-danger active:bg-danger-surface active:text-danger',
  solid:
    'bg-accent-strong text-accent-ink hover:brightness-110 active:brightness-95',
  // For sitting on top of artwork, where no flat colour is readable against
  // every cover
  glass: 'glass text-ink hover:brightness-105 active:brightness-95',
};

const sizes = {
  sm: 'size-7',
  md: 'size-9',
};

// An icon on its own says nothing to a screen reader, so the label is required
// rather than optional. It is also the tooltip
function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`focus-ring grid shrink-0 place-items-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default IconButton;
