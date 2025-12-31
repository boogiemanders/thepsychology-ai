'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Check,
  X,
  Pencil,
  Trash2,
  Loader2,
  GraduationCap,
  RefreshCw,
} from 'lucide-react'

interface GraduateProgram {
  id: string
  name: string
  institution: string
  program_type: string | null
  accreditation: string | null
  state: string | null
  country: string | null
  verified: boolean
  created_at: string
}

export default function AdminProgramsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [programs, setPrograms] = useState<GraduateProgram[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending')
  const [search, setSearch] = useState('')

  // Edit dialog state
  const [editProgram, setEditProgram] = useState<GraduateProgram | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    institution: '',
    program_type: '',
    accreditation: '',
    state: '',
  })
  const [saving, setSaving] = useState(false)

  // Delete dialog state
  const [deleteProgram, setDeleteProgram] = useState<GraduateProgram | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && user) {
      fetchPrograms()
    }
  }, [mounted, loading, user, filter])

  const fetchPrograms = async () => {
    setLoadingPrograms(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const verifiedParam =
        filter === 'pending' ? 'false' : filter === 'verified' ? 'true' : ''

      const url = `/api/admin/programs${verifiedParam ? `?verified=${verifiedParam}` : ''}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
        setPendingCount(data.pendingCount || 0)
      } else if (response.status === 403) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const handleVerify = async (program: GraduateProgram) => {
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/programs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({ id: program.id, verified: true }),
      })

      if (response.ok) {
        // Update local state
        setPrograms((prev) =>
          prev.map((p) => (p.id === program.id ? { ...p, verified: true } : p))
        )
        setPendingCount((prev) => Math.max(0, prev - 1))
        // Remove from list if viewing pending
        if (filter === 'pending') {
          setPrograms((prev) => prev.filter((p) => p.id !== program.id))
        }
      }
    } catch (err) {
      console.error('Failed to verify program:', err)
    }
  }

  const handleEdit = (program: GraduateProgram) => {
    setEditProgram(program)
    setEditForm({
      name: program.name,
      institution: program.institution,
      program_type: program.program_type || '',
      accreditation: program.accreditation || '',
      state: program.state || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editProgram) return
    setSaving(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/programs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          id: editProgram.id,
          ...editForm,
          verified: true, // Auto-verify on edit
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPrograms((prev) =>
          prev.map((p) => (p.id === editProgram.id ? data.program : p))
        )
        if (filter === 'pending') {
          setPrograms((prev) => prev.filter((p) => p.id !== editProgram.id))
          setPendingCount((prev) => Math.max(0, prev - 1))
        }
        setEditProgram(null)
      }
    } catch (err) {
      console.error('Failed to save program:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteProgram) return
    setDeleting(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch(`/api/admin/programs?id=${deleteProgram.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      })

      if (response.ok) {
        setPrograms((prev) => prev.filter((p) => p.id !== deleteProgram.id))
        if (!deleteProgram.verified) {
          setPendingCount((prev) => Math.max(0, prev - 1))
        }
        setDeleteProgram(null)
      }
    } catch (err) {
      console.error('Failed to delete program:', err)
    } finally {
      setDeleting(false)
    }
  }

  const filteredPrograms = useMemo(() => {
    if (!search) return programs
    const lower = search.toLowerCase()
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.institution.toLowerCase().includes(lower) ||
        p.state?.toLowerCase().includes(lower)
    )
  }, [programs, search])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6" />
                Graduate Programs
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage graduate program submissions
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchPrograms} disabled={loadingPrograms}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrograms ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Programs</CardDescription>
              <CardTitle className="text-3xl">
                {filter === 'all' ? programs.length : '—'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Filter</CardDescription>
              <CardContent className="p-0 pt-1">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="verified">Verified</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Programs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Accreditation</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPrograms ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {filter === 'pending'
                        ? 'No pending submissions'
                        : 'No programs found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.institution}</TableCell>
                      <TableCell>{program.name}</TableCell>
                      <TableCell>{program.program_type || '—'}</TableCell>
                      <TableCell>{program.accreditation || '—'}</TableCell>
                      <TableCell>{program.state || '—'}</TableCell>
                      <TableCell>
                        {program.verified ? (
                          <Badge variant="default" className="bg-green-500">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!program.verified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerify(program)}
                              title="Approve"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(program)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteProgram(program)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editProgram} onOpenChange={(open) => !open && setEditProgram(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Program</DialogTitle>
              <DialogDescription>
                Update program details. Saving will also mark it as verified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-institution">Institution</Label>
                <Input
                  id="edit-institution"
                  value={editForm.institution}
                  onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Program Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Degree Type</Label>
                  <Select
                    value={editForm.program_type}
                    onValueChange={(v) => setEditForm({ ...editForm, program_type: v })}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="PsyD">PsyD</SelectItem>
                      <SelectItem value="EdD">EdD</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accreditation">Accreditation</Label>
                  <Select
                    value={editForm.accreditation}
                    onValueChange={(v) => setEditForm({ ...editForm, accreditation: v })}
                  >
                    <SelectTrigger id="edit-accreditation">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APA">APA</SelectItem>
                      <SelectItem value="PCSAS">PCSAS</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                      <SelectItem value="Neither">Neither</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="e.g., NY"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditProgram(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Verify'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteProgram} onOpenChange={(open) => !open && setDeleteProgram(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Program?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{deleteProgram?.institution} - {deleteProgram?.name}&quot;.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
