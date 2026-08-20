// A placeholder shaped like the thing that is coming. Hidden from screen
// readers, which get the status message instead
function Skeleton({ className = '', rounded = 'rounded-card', ...rest }) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default Skeleton;
