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
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-xs text-[var(--muted-foreground)] mb-2 w-full">
        {min} = {labels[0]} &nbsp;···&nbsp; {max} = {labels[labels.length - 1]}
      </legend>
      <div className="rating-scale">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rating-button${value === v ? " selected" : ""}`}
            aria-label={labels[v - min]}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
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
    <div className="flex gap-1">
      {options.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-label={`${name}: ${v}`}
          className={`flex items-center justify-center rounded-lg border text-sm font-medium cursor-pointer transition-all
            w-9 h-9 sm:w-6 sm:h-6
            ${value === v
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
              : "bg-[var(--input-bg)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]"
            }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
