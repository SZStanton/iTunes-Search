const elevations = {
  1: 'elev-1',
  2: 'elev-2',
  3: 'elev-3',
};

function Surface({
  as: Tag = 'div',
  elevation = 2,
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`sheen rounded-card border border-line bg-surface ${elevations[elevation]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Surface;
