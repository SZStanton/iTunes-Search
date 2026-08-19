// One labelled input with its error underneath. The label is tied to the input
// by id, so clicking it focuses the field and a screen reader reads the pair
function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type={type}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-ink outline-none transition placeholder:text-muted focus:ring-2 ${
          error
            ? 'border-danger focus:ring-danger/40'
            : 'border-line focus:border-accent-strong focus:ring-accent-strong/30'
        }`}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />

      {error && (
        <p className="mt-1.5 text-sm text-danger" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
