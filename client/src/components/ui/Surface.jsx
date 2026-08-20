const elevations = {
  1: 'elev-1',
  2: 'elev-2',
  3: 'elev-3',
};

// A panel with a border and a place on the elevation ladder. Anything that
// holds content and is not the page itself is one of these
function Surface({
  as: Tag = 'div',
  elevation = 2,
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`rounded-card border border-line bg-surface ${elevations[elevation]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Surface;
