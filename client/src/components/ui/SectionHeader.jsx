// A small caps title with room for one action on the right. Used above every
// group that is not the results grid itself
function SectionHeader({ title, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="type-eyebrow">{title}</h2>
      {action}
    </div>
  );
}

export default SectionHeader;
