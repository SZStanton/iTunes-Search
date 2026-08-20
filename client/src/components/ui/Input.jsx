const shapes = {
  pill: 'rounded-full px-5',
  field: 'rounded-control px-3',
};

// A size prop rather than an overriding className, since py-3.5 and py-2.5 are
// the same kind of utility and CSS order picks the winner, not class order
const sizes = {
  md: 'py-2.5',
  lg: 'py-3.5 text-base',
};

function Input({
  shape = 'field',
  size = 'md',
  invalid = false,
  className = '',
  ...rest
}) {
  return (
    <input
      className={`w-full border bg-surface text-ink outline-none transition placeholder:text-muted ${shapes[shape]} ${sizes[size]} ${
        invalid
          ? 'border-danger focus:ring-4 focus:ring-danger/25'
          : 'border-line focus:border-accent-strong focus:ring-4 focus:ring-accent-strong/20'
      } ${className}`}
      aria-invalid={invalid ? 'true' : undefined}
      {...rest}
    />
  );
}

export default Input;
