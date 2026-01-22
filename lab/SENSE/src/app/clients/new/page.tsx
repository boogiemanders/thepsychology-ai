'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { CONTEXTS } from '@/lib/enums'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [safetyConfirmed, setSafetyConfirmed] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    settingDefault: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!safetyConfirmed) return

    setLoading(true)
    try {
      const response = await fetch('/SENSE/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          settingDefault: formData.settingDefault || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/clients/${data.id}`)
      }
    } catch (error) {
      console.error('Failed to create client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors tap-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Client</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block font-medium">
            Client Name or Identifier *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Alex M. or Client #123"
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
          />
          <p className="text-sm text-[var(--muted-foreground)]">
            Use initials or a code for confidentiality
          </p>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <label htmlFor="age" className="block font-medium">
            Age (optional)
          </label>
          <input
            id="age"
            type="number"
            min="0"
            max="120"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="e.g., 8"
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
          />
        </div>

        {/* Default Setting */}
        <div className="space-y-2">
          <label htmlFor="setting" className="block font-medium">
            Primary Setting (optional)
          </label>
          <select
            id="setting"
            value={formData.settingDefault}
            onChange={(e) => setFormData({ ...formData, settingDefault: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
          >
            <option value="">Select setting...</option>
            {CONTEXTS.map((context) => (
              <option key={context.id} value={context.id}>
                {context.label}
              </option>
            ))}
          </select>
        </div>

        {/* Safety Guardrail */}
        <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Clinical Responsibility Acknowledgment
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                SENSE is a clinical decision support tool. Sensory processing
                considerations are one factor among many in comprehensive assessment.
                This tool does not replace clinical judgment or comprehensive evaluation.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={safetyConfirmed}
              onChange={(e) => setSafetyConfirmed(e.target.checked)}
              className="w-5 h-5 rounded border-[var(--border)]"
            />
            <span className="text-sm">
              I understand and will use this tool responsibly
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !safetyConfirmed || !formData.name}
          className="w-full py-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium disabled:opacity-50 tap-target"
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </form>
    </div>
  )
}
