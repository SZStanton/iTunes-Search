import Input from './ui/Input';

// A labelled input with its error underneath, tied together by id.
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
      <label className="type-chrome mb-1.5 block text-sm text-ink" htmlFor={id}>
        {label}
      </label>

      <Input
        id={id}
        type={type}
        invalid={Boolean(error)}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
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
