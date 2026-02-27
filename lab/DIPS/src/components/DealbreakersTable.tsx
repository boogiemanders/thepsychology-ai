"use client";

interface Scenario {
  id: string;
  text: string;
}

type Response = "dealbreaker" | "acceptable" | "unsure";

interface DealbreakersTableProps {
  scenarios: readonly Scenario[];
  responses: Record<string, Response | null>;
  onChange: (id: string, value: Response) => void;
}

const OPTIONS: { value: Response; label: string }[] = [
  { value: "dealbreaker", label: "Dealbreaker" },
  { value: "acceptable", label: "Acceptable" },
  { value: "unsure", label: "Unsure" },
];

export function DealbreakersTable({
  scenarios,
  responses,
  onChange,
}: DealbreakersTableProps) {
  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <div key={scenario.id} className="p-4 border border-[var(--border)] rounded-lg">
          <p className="text-sm mb-3">{scenario.text}</p>
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map((opt) => {
              const sel = responses[scenario.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(scenario.id, opt.value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all text-center
                    ${sel
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "bg-[var(--input-bg)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
