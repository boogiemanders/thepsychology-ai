import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface ProjectCardProps {
  href?: string;
  title: string;
  description: string;
  dates?: string;
  tags?: string[];
  image?: string;
  video?: string;
  links?: Array<{
    icon?: React.ReactNode;
    title: string;
    href: string;
  }>;
}

export const ProjectCard = ({
  href,
  title,
  description,
  dates,
  tags,
  image,
  video,
  links,
}: ProjectCardProps) => {
  return (
    <Link href={href || "#"}>
      <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm p-4 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer">
        {image && (
          <img
            src={image}
            alt={title}
            className="h-40 w-full rounded-lg object-cover mb-4"
          />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {title}
              </h3>
              {dates && <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{dates}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {tags && tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {links && links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {links.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {link.title}
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
