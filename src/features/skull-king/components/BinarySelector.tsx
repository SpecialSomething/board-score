type BinarySelectorProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
};

export default function BinarySelector({ 
    value, 
    onChange, 
    disabled = false 
}: BinarySelectorProps) {
  const baseClass = "h-[35px] min-w-[70px] rounded-xl px-3 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text";

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={!value}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`${baseClass} ${
          !value ? "bg-board-primary text-white" : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
        }`}
      >
        미획득
      </button>
      <button
        type="button"
        aria-pressed={value}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`h-[35px] w-[70px] rounded-xl text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text ${
          value ? "bg-board-primary text-white" : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
        }`}
      >
        획득
      </button>
    </div>
  );
}