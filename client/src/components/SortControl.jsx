import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { SORT_FIELDS, fieldLabel, orderLabel } from '../sorting';
import IconButton from './ui/IconButton';

function SortControl({ field, reversed, onField, onReverse }) {
  const order = orderLabel(field, reversed);

  return (
    <div className="flex items-center gap-2">
      <label className="type-eyebrow" htmlFor="sort">
        Sort
      </label>

      <select
        className="type-chrome focus-ring rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink outline-none transition"
        id="sort"
        value={field}
        onChange={event => onField(event.target.value)}
      >
        {SORT_FIELDS.map(sort => (
          <option value={sort.value} key={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>

      {/* An arrow on its own says nothing, so the label names the order. */}
      <IconButton
        label={`${order} first. Reverse the order`}
        size="sm"
        aria-pressed={reversed}
        onClick={onReverse}
      >
        {reversed ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      </IconButton>

      <p className="sr-only" role="status">
        Sorted by {fieldLabel(field)}, {order} first
      </p>
    </div>
  );
}

export default SortControl;
