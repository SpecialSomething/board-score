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
  const options = Array.from({ length: max + 1 }, (_, index) => index);

  return (
    <fieldset disabled={disabled} className="w-full p-2">
      <legend className="text-base font-semibold leading-normal">{label}</legend>

      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`flex size-[35px] items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-[#eeeeee] disabled:text-[#a6a6a6] ${
                isSelected
                  ? "bg-[#767676] text-white"
                  : "bg-[#dddddd] text-black hover:bg-[#cecece]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
