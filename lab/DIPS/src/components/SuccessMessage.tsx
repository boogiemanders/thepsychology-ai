"use client";

import { Check } from "lucide-react";
import Link from "next/link";

interface SuccessMessageProps {
  title?: string;
  message?: string;
}

export function SuccessMessage({
  title = "Thank you!",
  message = "Your response has been recorded successfully.",
}: SuccessMessageProps) {
  return (
    <div className="success-message">
      <div className="success-icon">
        <Check className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-[var(--muted-foreground)] mb-6">{message}</p>
      <Link href="/" className="btn btn-primary">
        Return to Surveys
      </Link>
    </div>
  );
}
