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
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type={type}
        className={`form-control${error ? ' is-invalid' : ''}`}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />

      {error && (
        <p className="invalid-feedback" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
