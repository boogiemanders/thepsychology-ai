"use client";

import { LikertScaleCompact } from "./LikertScale";

interface TripleRatingRowProps {
  id: string;
  label: string;
  rating1Value: number | null;
  rating1Labels: readonly string[];
  onRating1Change: (value: number) => void;
  rating2Value: number | null;
  rating2Labels: readonly string[];
  onRating2Change: (value: number) => void;
  rating3Value: number | null;
  rating3Labels: readonly string[];
  onRating3Change: (value: number) => void;
}

export function TripleRatingRow({
  id,
  label,
  rating1Value,
  rating1Labels,
  onRating1Change,
  rating2Value,
  rating2Labels,
  onRating2Change,
  rating3Value,
  rating3Labels,
  onRating3Change,
}: TripleRatingRowProps) {
  return (
    <div className="py-4 border-b border-[var(--border)] last:border-b-0">
      <div className="font-medium text-sm mb-3">{label}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-[var(--muted-foreground)] mb-1.5 sm:hidden">Importance</div>
          <LikertScaleCompact
            name={`${id}-importance`}
            value={rating1Value}
            onChange={onRating1Change}
          />
          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1 px-0.5">
            <span>{rating1Labels[0]}</span>
            <span>{rating1Labels[4]}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted-foreground)] mb-1.5 sm:hidden">Ability</div>
          <LikertScaleCompact
            name={`${id}-ability`}
            value={rating2Value}
            onChange={onRating2Change}
          />
          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1 px-0.5">
            <span>{rating2Labels[0]}</span>
            <span>{rating2Labels[4]}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted-foreground)] mb-1.5 sm:hidden">Confidence</div>
          <LikertScaleCompact
            name={`${id}-confidence`}
            value={rating3Value}
            onChange={onRating3Change}
          />
          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1 px-0.5">
            <span>{rating3Labels[0]}</span>
            <span>{rating3Labels[4]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TripleRatingHeader({
  column1Label,
  column1Subtitle,
  column2Label,
  column2Subtitle,
  column3Label,
  column3Subtitle,
}: {
  column1Label: string;
  column1Subtitle?: string;
  column2Label: string;
  column2Subtitle?: string;
  column3Label: string;
  column3Subtitle?: string;
}) {
  return (
    <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr] gap-3 border-b-2 border-[var(--border)] pb-3 mb-2 pl-[calc(100%/3+0.75rem)]">
      <div className="text-center">
        <div className="font-semibold text-xs">{column1Label}</div>
        {column1Subtitle && (
          <div className="text-[10px] text-[var(--muted-foreground)]">{column1Subtitle}</div>
        )}
      </div>
      <div className="text-center">
        <div className="font-semibold text-xs">{column2Label}</div>
        {column2Subtitle && (
          <div className="text-[10px] text-[var(--muted-foreground)]">{column2Subtitle}</div>
        )}
      </div>
      <div className="text-center">
        <div className="font-semibold text-xs">{column3Label}</div>
        {column3Subtitle && (
          <div className="text-[10px] text-[var(--muted-foreground)]">{column3Subtitle}</div>
        )}
      </div>
    </div>
  );
}
