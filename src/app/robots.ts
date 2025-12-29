import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config"

export const runtime = "nodejs"
export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/$/, "")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/app/",
          "/dashboard/",
          "/login",
          "/signup",
          "/payment/",
          "/prioritize/",
          "/prioritizer/",
          "/quizzer/",
          "/recover/",
          "/review-exams/",
          "/study-optimizer/",
          "/topic-selector/",
          "/topic-teacher/",
          "/trial-expired/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

