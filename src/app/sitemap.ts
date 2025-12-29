import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config"
import { getAllTopicContentEntries } from "@/lib/seo/topic-content.server"

export const runtime = "nodejs"
export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url.replace(/\/$/, "")
  const now = new Date()

  const staticPaths: Array<{ path: string; changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]; priority?: number }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/resources", changeFrequency: "weekly", priority: 0.8 },
    { path: "/resources/practice-questions", changeFrequency: "weekly", priority: 0.7 },
    { path: "/resources/sample-exams", changeFrequency: "weekly", priority: 0.7 },
    { path: "/case-bank", changeFrequency: "weekly", priority: 0.7 },
    { path: "/eppp-practice-questions", changeFrequency: "weekly", priority: 0.7 },
    { path: "/eppp-passing-score", changeFrequency: "monthly", priority: 0.6 },
    { path: "/eppp-sections", changeFrequency: "monthly", priority: 0.6 },
    { path: "/portfolio", changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.4 },
  ]

  const topics = getAllTopicContentEntries()
  const domainDirs = Array.from(new Set(topics.map((t) => t.domainDir))).sort((a, b) => a.localeCompare(b))

  const domainPaths = domainDirs.map((domainDir) => ({
    url: `${baseUrl}/resources/topics/${domainDir}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  const topicPaths = topics.map((topic) => ({
    url: `${baseUrl}/resources/topics/${topic.domainDir}/${topic.slug}`,
    lastModified: topic.lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }))

  return [
    ...staticPaths.map(({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...domainPaths,
    ...topicPaths,
  ]
}
