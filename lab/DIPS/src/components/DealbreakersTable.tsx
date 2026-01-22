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

export function DealbreakersTable({
  scenarios,
  responses,
  onChange,
}: DealbreakersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="dealbreakers-table">
        <thead>
          <tr>
            <th className="min-w-[200px]">Scenario</th>
            <th className="text-center w-24">Dealbreaker</th>
            <th className="text-center w-24">Acceptable</th>
            <th className="text-center w-24">Unsure</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => (
            <tr key={scenario.id}>
              <td className="text-sm">{scenario.text}</td>
              <td className="text-center">
                <input
                  type="radio"
                  name={scenario.id}
                  checked={responses[scenario.id] === "dealbreaker"}
                  onChange={() => onChange(scenario.id, "dealbreaker")}
                />
              </td>
              <td className="text-center">
                <input
                  type="radio"
                  name={scenario.id}
                  checked={responses[scenario.id] === "acceptable"}
                  onChange={() => onChange(scenario.id, "acceptable")}
                />
              </td>
              <td className="text-center">
                <input
                  type="radio"
                  name={scenario.id}
                  checked={responses[scenario.id] === "unsure"}
                  onChange={() => onChange(scenario.id, "unsure")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
