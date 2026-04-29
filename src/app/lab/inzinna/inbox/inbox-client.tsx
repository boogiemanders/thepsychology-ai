'use client'
import { useEffect, useMemo, useState } from 'react'
import './inbox.css'

export interface InziMessage {
  id: string
  intent: 'scheduling' | 'billing' | 'clinical' | 'general'
  patient_name: string
  patient_email: string
  patient_phone: string | null
  summary: string
  payload: Record<string, any>
  urgency: 'low' | 'normal' | 'urgent'
  assigned_clinician: string | null
  status: 'new' | 'read' | 'responded'
  created_at: string
  updated_at: string
}

const INTENT_LABEL: Record<InziMessage['intent'], string> = {
  scheduling: 'Scheduling',
  billing: 'Billing',
  clinical: 'Clinician',
  general: 'General',
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export function InboxClient({ initialMessages }: { initialMessages: InziMessage[] }) {
  const [messages, setMessages] = useState<InziMessage[]>(initialMessages)
  const [filter, setFilter] = useState<'all' | InziMessage['intent']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialMessages[0]?.id ?? null)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = useMemo(() => {
    return messages.filter(m => {
      if (filter !== 'all' && m.intent !== filter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      return true
    })
  }, [messages, filter, statusFilter])

  const selected = messages.find(m => m.id === selectedId) || filtered[0] || null

  const counts = useMemo(() => ({
    all: messages.length,
    scheduling: messages.filter(m => m.intent === 'scheduling').length,
    billing: messages.filter(m => m.intent === 'billing').length,
    clinical: messages.filter(m => m.intent === 'clinical').length,
    general: messages.filter(m => m.intent === 'general').length,
    new: messages.filter(m => m.status === 'new').length,
  }), [messages])

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/inzi/inbox')
      const data = await res.json()
      if (Array.isArray(data.messages)) setMessages(data.messages)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [])

  const updateStatus = async (id: string, status: 'read' | 'responded') => {
    const optimistic = messages.map(m => m.id === id ? { ...m, status } : m)
    setMessages(optimistic)
    try {
      await fetch(`/api/inzi/inbox/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {}
  }

  return (
    <div className="inbox-root">
      <header className="inbox-header">
        <div>
          <div className="inbox-title">Inzi Inbox</div>
          <div className="inbox-sub">{counts.new} new · {messages.length} total</div>
        </div>
        <button className="inbox-refresh" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'refreshing...' : 'refresh'}
        </button>
      </header>

      <div className="inbox-toolbar">
        <div className="inbox-filter-group">
          {(['all', 'scheduling', 'clinical', 'billing', 'general'] as const).map(f => (
            <button
              key={f}
              className={`inbox-filter ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : INTENT_LABEL[f]}
              <span className="inbox-filter__count">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="inbox-filter-group">
          {(['all', 'new', 'read'] as const).map(s => (
            <button
              key={s}
              className={`inbox-filter inbox-filter--small ${statusFilter === s ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="inbox-body">
        <aside className="inbox-list">
          {filtered.length === 0 && (
            <div className="inbox-empty">no messages match these filters.</div>
          )}
          {filtered.map(m => (
            <button
              key={m.id}
              className={`inbox-item ${selected?.id === m.id ? 'is-selected' : ''} ${m.status === 'new' ? 'is-new' : ''}`}
              onClick={() => { setSelectedId(m.id); if (m.status === 'new') updateStatus(m.id, 'read') }}
            >
              <div className="inbox-item__top">
                <span className={`inbox-tag inbox-tag--${m.intent}`}>{INTENT_LABEL[m.intent]}</span>
                {m.urgency === 'urgent' && <span className="inbox-tag inbox-tag--urgent">urgent</span>}
                <span className="inbox-item__when">{timeAgo(m.created_at)}</span>
              </div>
              <div className="inbox-item__name">{m.patient_name}</div>
              <div className="inbox-item__preview">{m.summary}</div>
              {m.assigned_clinician && (
                <div className="inbox-item__to">to: {m.assigned_clinician}</div>
              )}
            </button>
          ))}
        </aside>

        <main className="inbox-detail">
          {!selected ? (
            <div className="inbox-detail__empty">select a message</div>
          ) : (
            <>
              <div className="inbox-detail__head">
                <div className="inbox-detail__row">
                  <span className={`inbox-tag inbox-tag--${selected.intent}`}>{INTENT_LABEL[selected.intent]}</span>
                  {selected.urgency === 'urgent' && <span className="inbox-tag inbox-tag--urgent">urgent</span>}
                  <span className={`inbox-tag inbox-tag--status status-${selected.status}`}>{selected.status}</span>
                </div>
                <div className="inbox-detail__name">{selected.patient_name}</div>
                <div className="inbox-detail__contact">
                  <a href={`mailto:${selected.patient_email}`}>{selected.patient_email}</a>
                  {selected.patient_phone && <span> · {selected.patient_phone}</span>}
                </div>
                {selected.assigned_clinician && (
                  <div className="inbox-detail__to">to: {selected.assigned_clinician}</div>
                )}
                <div className="inbox-detail__when">{new Date(selected.created_at).toLocaleString()}</div>
              </div>

              <div className="inbox-detail__section">
                <div className="inbox-detail__label">Summary</div>
                <div className="inbox-detail__body">{selected.summary}</div>
              </div>

              {Object.keys(selected.payload || {}).length > 0 && (
                <div className="inbox-detail__section">
                  <div className="inbox-detail__label">Details</div>
                  <dl className="inbox-detail__dl">
                    {Object.entries(selected.payload).map(([k, v]) => (
                      <div key={k} className="inbox-detail__dl-row">
                        <dt>{k}</dt>
                        <dd>{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="inbox-detail__actions">
                <a className="inbox-action inbox-action--reply" href={`mailto:${selected.patient_email}?subject=Re: ${INTENT_LABEL[selected.intent]} request`}>
                  reply by email
                </a>
                {selected.status !== 'responded' && (
                  <button className="inbox-action inbox-action--resolve" onClick={() => updateStatus(selected.id, 'responded')}>
                    mark as responded
                  </button>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
