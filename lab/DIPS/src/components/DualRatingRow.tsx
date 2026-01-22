"use client";

import { LikertScaleCompact } from "./LikertScale";

interface DualRatingRowProps {
  id: string;
  label: string;
  rating1Name: string;
  rating1Value: number | null;
  rating1Labels: readonly string[];
  onRating1Change: (value: number) => void;
  rating2Name: string;
  rating2Value: number | null;
  rating2Labels: readonly string[];
  onRating2Change: (value: number) => void;
}

export function DualRatingRow({
  id,
  label,
  rating1Name,
  rating1Value,
  onRating1Change,
  rating2Name,
  rating2Value,
  onRating2Change,
}: DualRatingRowProps) {
  return (
    <div className="grid grid-cols-[1fr_130px_130px] gap-2 items-center py-3 border-b border-[var(--border)] last:border-b-0">
      <div className="font-medium text-sm pr-2">{label}</div>
      <div className="flex justify-center">
        <LikertScaleCompact
          name={`${id}-${rating1Name}`}
          value={rating1Value}
          onChange={onRating1Change}
        />
      </div>
      <div className="flex justify-center">
        <LikertScaleCompact
          name={`${id}-${rating2Name}`}
          value={rating2Value}
          onChange={onRating2Change}
        />
      </div>
    </div>
  );
}

// Header row for dual rating tables
export function DualRatingHeader({
  column1Label,
  column1Subtitle,
  column2Label,
  column2Subtitle,
}: {
  column1Label: string;
  column1Subtitle?: string;
  column2Label: string;
  column2Subtitle?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_130px_130px] gap-2 items-end border-b-2 border-[var(--border)] pb-3 mb-2">
      <div className="font-semibold text-sm">Skill</div>
      <div className="text-center">
        <div className="font-semibold text-sm">{column1Label}</div>
        {column1Subtitle && (
          <div className="text-xs text-[var(--muted-foreground)]">{column1Subtitle}</div>
        )}
      </div>
      <div className="text-center">
        <div className="font-semibold text-sm">{column2Label}</div>
        {column2Subtitle && (
          <div className="text-xs text-[var(--muted-foreground)]">{column2Subtitle}</div>
        )}
      </div>
    </div>
  );
}
