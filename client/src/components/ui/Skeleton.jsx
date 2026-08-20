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
