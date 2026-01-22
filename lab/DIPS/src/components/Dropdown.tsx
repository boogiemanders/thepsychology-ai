"use client";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly DropdownOption[];
  placeholder?: string;
}

export function Dropdown({
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
}: DropdownProps) {
  return (
    <select
      name={name}
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
