type NumberSelectorProps = {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function NumberSelector({
  label,
  value,
  max,
  onChange,
  disabled = false,
}: NumberSelectorProps) {
  const options = Array.from(
    { length: max + 1 },
    (_, index) => index
  );

  return (
    <fieldset disabled={disabled}>
      <legend>{label}</legend>

      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}