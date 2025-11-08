'use client'

import Link from "next/link"
import { BarChart3, CheckCircle, Lightbulb, ArrowRight } from "lucide-react"
import { motion } from "motion/react"

const tools = [
  {
    id: "exam-generator",
    title: "Practice",
    icon: BarChart3,
    path: "/tools/exam-generator",
    description: "Generate 225-question practice exams",
    gradient: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/20",
    iconBg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500"
  },
  {
    id: "study-optimizer",
    title: "Prioritize",
    icon: Lightbulb,
    path: "/tools/study-optimizer",
    description: "Analyze results and get study recommendations",
    gradient: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/20",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500"
  },
  {
    id: "topic-selector",
    title: "Study",
    icon: CheckCircle,
    path: "/tools/topic-selector",
    description: "Browse and select topics to study",
    gradient: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/20",
    iconBg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500"
  },
]

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-4">
            EPPP Study Tools
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Click to expand domains and select your topic.
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-1 gap-6">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={tool.path}>
                  <div className={`group relative overflow-hidden rounded-xl border ${tool.borderColor} bg-gradient-to-br ${tool.gradient} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:border-primary/40 cursor-pointer`}>
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-grid-white/5 -z-10" />
                    <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-l from-primary/5 to-transparent blur-3xl" />

                    {/* Content */}
                    <div className="p-8 relative z-10">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${tool.iconBg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className={`w-6 h-6 ${tool.iconColor}`} />
                          </div>

                          <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-muted-foreground group-hover:text-foreground/70 transition-colors">
                            {tool.description}
                          </p>
                        </div>

                        <motion.div
                          className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                        >
                          <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </div>

                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
