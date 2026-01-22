"use client";

import { cn } from "@/lib/utils";

interface RatingScaleProps {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}

export function RatingScale({
  name,
  value,
  onChange,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
}: RatingScaleProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="inline-flex flex-col">
      {(lowLabel || highLabel) && (
        <div className="flex gap-1 text-xs text-[var(--muted-foreground)] mb-1">
          {options.map((optionValue, index) => (
            <span key={optionValue} className="w-10 text-center">
              {index === 0 ? lowLabel : index === options.length - 1 ? highLabel : ""}
            </span>
          ))}
        </div>
      )}
      <div className="rating-scale">
        {options.map((optionValue) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn("rating-button", value === optionValue && "selected")}
            aria-label={`${name}: ${optionValue}`}
          >
            {optionValue}
          </button>
        ))}
      </div>
    </div>
  );
}
