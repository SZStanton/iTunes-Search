const shapes = {
  pill: 'rounded-full px-5',
  field: 'rounded-control px-3',
};

// The focus treatment is a glow rather than a bare ring, since the field is the
// thing the whole page is about and a hairline outline undersells it
function Input({ shape = 'field', invalid = false, className = '', ...rest }) {
  return (
    <input
      className={`w-full border bg-surface py-2.5 text-ink outline-none transition placeholder:text-muted ${shapes[shape]} ${
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
