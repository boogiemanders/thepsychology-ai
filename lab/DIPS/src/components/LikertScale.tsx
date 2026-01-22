"use client";

interface LikertScaleProps {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  labels?: readonly string[];
  min?: number;
  max?: number;
  required?: boolean;
}

const DEFAULT_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

export function LikertScale({
  name,
  value,
  onChange,
  labels = DEFAULT_LABELS,
  min = 1,
  max = 5,
}: LikertScaleProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((optionValue, index) => (
        <label key={optionValue} className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
          <input
            type="radio"
            name={name}
            value={optionValue}
            checked={value === optionValue}
            onChange={() => onChange(optionValue)}
            className="w-5 h-5 accent-[var(--primary)]"
          />
          <span className="text-xs text-center text-[var(--muted-foreground)]">{labels[index] || optionValue}</span>
        </label>
      ))}
    </div>
  );
}

// Compact version for tables/matrices
export function LikertScaleCompact({
  name,
  value,
  onChange,
  min = 1,
  max = 5,
}: Omit<LikertScaleProps, "labels">) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="flex gap-2">
      {options.map((optionValue) => (
        <label key={optionValue} className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={name}
            value={optionValue}
            checked={value === optionValue}
            onChange={() => onChange(optionValue)}
            className="w-5 h-5 accent-[var(--primary)]"
          />
        </label>
      ))}
    </div>
  );
}
