type NumberSelectorProps = {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

export default function NumberSelector({
  label,
  value,
  max,
  onChange,
  disabled = false,
  readOnly = false,
}: NumberSelectorProps) {
  const options = Array.from(
    { length: max + 1 },
    (_, index) => index,
  );
  const firstRow = options.filter(
    (option) => option <= 5,
  );
  
  const secondRow = options.filter(
    (option) => option >= 6,
  );

  const renderButton = (option: number) => {
    const isSelected = value === option;
  
    const buttonColorClass = disabled
      ? "bg-board-disabled text-board-disabled-text"
      : readOnly
        ? isSelected
          ? "bg-board-primary text-white"
          : "bg-board-disabled text-board-disabled-text"
        : isSelected
          ? "bg-board-primary text-white"
          : "bg-board-secondary text-board-text";
  
    const interactionClass =
      disabled
        ? "cursor-not-allowed opacity-50"
        : readOnly
          ? "cursor-default"
          : "hover:bg-board-primary-soft";
  
    return (
      <button
        key={option}
        type="button"
        aria-pressed={isSelected}
        disabled={disabled}
        aria-disabled={disabled || readOnly}
        onClick={() => {
          if (disabled || readOnly) {
            return;
          }
        
          onChange(option);
        }}
        className={`flex size-[35px] items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary ${buttonColorClass} ${interactionClass}`}
      >
        {option}
      </button>
    );
  };

  return (
    <fieldset
      disabled={disabled}
      className="w-full"
    >
      <legend className="text-base font-semibold leading-normal">
        {label}
      </legend>

      <div className="mt-2 space-y-2">
        <div className="flex gap-2">
          {firstRow.map(renderButton)}
        </div>
      
        {secondRow.length > 0 && (
          <div className="flex gap-2">
            {secondRow.map(renderButton)}
          </div>
        )}
      </div>
    </fieldset>
  );
}