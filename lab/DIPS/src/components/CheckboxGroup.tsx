"use client";

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  options: readonly CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  showOtherInput?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

export function CheckboxGroup({
  options,
  selectedValues,
  onChange,
  showOtherInput = false,
  otherValue = "",
  onOtherChange,
}: CheckboxGroupProps) {
  const handleToggle = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  const isOtherSelected = selectedValues.includes("other");

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => {
        const isChecked = selectedValues.includes(option.id);
        return (
          <label
            key={option.id}
            className={`flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-lg border cursor-pointer transition-all
              ${isChecked
                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
              }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggle(option.id)}
              className="sr-only"
            />
            <span
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                ${isChecked ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)]"}`}
            >
              {isChecked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-sm">{option.label}</span>
          </label>
        );
      })}

      {/* Other input field */}
      {showOtherInput && isOtherSelected && onOtherChange && (
        <div className="ml-8 mt-1">
          <input
            type="text"
            className="form-input"
            placeholder="Please specify..."
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
