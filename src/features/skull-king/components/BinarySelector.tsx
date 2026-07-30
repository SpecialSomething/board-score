type BinarySelectorProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  readOnly: boolean;
};



export default function BinarySelector({ 
    value, 
    onChange, 
    disabled = false,
    readOnly = false, 
}: BinarySelectorProps) {
  const baseClass = "h-[35px] min-w-[70px] rounded-xl px-3 text-base font-semibold transition-colors disabled:cursor-not-allowed";

  const getButtonClass = (
    isSelected: boolean,
  ) => {
    if (disabled) {
      return "bg-board-disabled text-board-disabled-text";
    }
  
    if (readOnly) {
      return isSelected
        ? "bg-board-primary text-white"
        : "bg-board-disabled text-board-disabled-text";
    }
  
    return isSelected
      ? "bg-board-primary text-white"
      : "bg-board-secondary text-board-text hover:bg-board-primary-soft";
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={!value}
        disabled={disabled}
        aria-disabled={disabled || readOnly}
        onClick={() => {
          if (disabled || readOnly) {
            return;
          }
      
          onChange(false);
        }}
        className={`${baseClass} ${getButtonClass(!value)} ${
          disabled || readOnly
            ? "cursor-not-allowed"
            : ""
        }`}
      >
        미획득
      </button>
      <button
        type="button"
        aria-pressed={value}
        disabled={disabled}
        aria-disabled={disabled || readOnly}
        onClick={() => {
          if (disabled || readOnly) {
            return;
          }
      
          onChange(true);
        }}
        className={`${baseClass} ${getButtonClass(value)} ${
          disabled || readOnly
            ? "cursor-not-allowed"
            : ""
        }`}
      >
        획득
      </button>
    </div>
  );
}