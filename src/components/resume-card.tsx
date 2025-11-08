import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";

interface ResumeCardProps {
  logoUrl?: string;
  altText?: string;
  title: string;
  subtitle?: string;
  href?: string;
  badges?: string[];
  period?: string;
  description?: string;
}

export const ResumeCard = ({
  logoUrl,
  altText,
  title,
  subtitle,
  href,
  badges,
  period,
  description,
}: ResumeCardProps) => {
  const content = (
    <div className="flex items-center gap-4">
      {logoUrl && (
        <img
          src={logoUrl}
          alt={altText}
          className="relative h-12 w-12 rounded-md object-cover"
        />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold leading-none">{title}</h3>
          {period && <span className="text-sm text-muted-foreground">{period}</span>}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {badges && badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="px-1 py-0 text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} target="_blank">
        {content}
      </Link>
    );
  }

  return content;
};
