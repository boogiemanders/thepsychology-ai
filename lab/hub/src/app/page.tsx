import { Brain, Beaker, Sparkles, Microscope } from 'lucide-react'

// In development, SENSE runs on port 3001. In production, middleware handles /SENSE rewrite.
const SENSE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001/SENSE'
  : '/SENSE'

const projects = [
  {
    id: 'sense',
    name: 'SENSE',
    description: 'A clinician-first tool for integrating sensory processing considerations into therapy sessions.',
    status: 'active' as const,
    href: SENSE_URL,
    icon: Brain,
    category: 'Tool',
    tags: ['Clinical', 'Sensory Processing', 'Session Notes'],
    date: 'Jan 2025',
    color: '#8b5cf6', // Purple
  },
  {
    id: 'coming-1',
    name: 'Pattern Recognition',
    description: 'AI-assisted pattern detection in clinical observations and session data.',
    status: 'coming-soon' as const,
    href: '#',
    icon: Sparkles,
    category: 'Research',
    tags: ['AI', 'Pattern Detection', 'Clinical'],
    date: 'Coming Soon',
    color: '#3b82f6', // Blue
  },
  {
    id: 'coming-2',
    name: 'Intervention Library',
    description: 'Evidence-based intervention database with outcome tracking.',
    status: 'coming-soon' as const,
    href: '#',
    icon: Microscope,
    category: 'Tool',
    tags: ['Interventions', 'Evidence-Based', 'Outcomes'],
    date: 'Coming Soon',
    color: '#10b981', // Green
  },
]

export default function LabHomePage() {
  return (
    <div className="p-6 md:p-10">
      {/* Project Grid - MIT Media Lab style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const Icon = project.icon
          const isActive = project.status === 'active'

          return (
            <a
              key={project.id}
              href={isActive ? project.href : undefined}
              className={`project-card ${!isActive ? 'pointer-events-none' : ''}`}
            >
              {/* Card Image/Visual */}
              <div
                className="card-image flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${project.color}22 0%, ${project.color}44 100%)` }}
              >
                <Icon
                  className="w-16 h-16"
                  style={{ color: project.color }}
                />

                {/* Glyph overlay like MIT Media Lab */}
                <div className="card-glyph text-white text-xs font-medium flex items-center gap-2">
                  <Icon className="w-3 h-3" />
                  <span>{project.category}</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="py-4">
                <h3 className="card-title flex items-center gap-2">
                  {!isActive && <span className="status-coming-soon" />}
                  {isActive && <span className="status-active" />}
                  {project.name}
                </h3>

                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                  {project.description}
                </p>

                <div className="card-meta">
                  {project.date}
                </div>

                <div className="card-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="card-tag">
                      #{tag.toLowerCase().replace(/\s+/g, '')}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Featured Section */}
      <section className="mt-16">
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-6">
          Featured
        </h2>

        <a
          href={SENSE_URL}
          className="block bg-black text-white rounded-lg overflow-hidden hover:bg-gray-900 transition-colors"
        >
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 bg-white/10 rounded-lg">
              <Brain className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="text-pink-500 text-sm font-medium mb-2">Now Available</div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">SENSE</h3>
              <p className="text-gray-400 max-w-xl">
                Integrate sensory processing considerations into your therapy practice.
                Track clients, run session wizards, and generate clinical notes.
              </p>
            </div>
            <div className="text-pink-500 text-sm font-medium">
              Explore →
            </div>
          </div>
        </a>
      </section>

      {/* About Section */}
      <section className="mt-16 pb-12">
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-6">
          About the Lab
        </h2>

        <div className="max-w-2xl">
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            The thepsychology.ai Lab is where we explore new ideas at the intersection of
            psychology, therapy, and technology. Our projects aim to support clinicians
            with thoughtful tools that enhance human expertise.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-4">
            Every tool we build prioritizes clinical judgment, ethical AI use, and
            evidence-based practice.
          </p>
        </div>
      </section>
    </div>
  )
}
