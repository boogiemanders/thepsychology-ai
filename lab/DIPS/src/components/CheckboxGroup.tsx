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
    <div className="checkbox-group">
      {options.map((option) => (
        <label key={option.id} className="checkbox-option">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.id)}
            onChange={() => handleToggle(option.id)}
          />
          <span>{option.label}</span>
        </label>
      ))}

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
