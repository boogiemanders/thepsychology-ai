"use client";

interface TextAreaProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export function TextArea({
  name,
  value,
  onChange,
  placeholder = "Enter your response...",
  rows = 4,
  maxLength,
}: TextAreaProps) {
  return (
    <div>
      <textarea
        name={name}
        className="form-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
      {maxLength && (
        <div className="text-right text-xs text-[var(--muted-foreground)] mt-1">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
