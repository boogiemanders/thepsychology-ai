'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Shield,
  GraduationCap,
  Download,
  Trash2,
  Loader2,
  Check,
  Info,
} from 'lucide-react'

interface GraduateProgram {
  id: string
  name: string
  institution: string
  program_type: string
  accreditation: string
  state: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, userProfile, consentPreferences, loading, updateConsent, refreshConsent } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [programs, setPrograms] = useState<GraduateProgram[]>([])
  const [programSearch, setProgramSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [researchProfile, setResearchProfile] = useState<any>(null)
  const [loadingPrograms, setLoadingPrograms] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch graduate programs when research is enabled
  useEffect(() => {
    if (consentPreferences?.consent_research_contribution) {
      fetchPrograms()
      fetchResearchProfile()
    }
  }, [consentPreferences?.consent_research_contribution])

  const fetchPrograms = async () => {
    if (!user) return
    setLoadingPrograms(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch(`/api/research/programs?limit=50`, {
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const fetchResearchProfile = async () => {
    if (!user) return
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch('/api/research/profile', {
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setResearchProfile(data.profile)
        if (data.profile?.graduate_program_id) {
          setSelectedProgram(data.profile.graduate_program_id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch research profile:', err)
    }
  }

  const handleConsentChange = async (key: string, value: boolean) => {
    setSaving(key)
    setSaveSuccess(null)
    try {
      await updateConsent({ [key]: value })
      setSaveSuccess(key)
      setTimeout(() => setSaveSuccess(null), 2000)
    } catch (err) {
      console.error('Failed to update consent:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleProgramSelect = async (programId: string) => {
    setSelectedProgram(programId)
    try {
      const { data: session } = await supabase.auth.getSession()
      await fetch('/api/research/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({ graduate_program_id: programId }),
      })
    } catch (err) {
      console.error('Failed to update program:', err)
    }
  }

  const handleDownloadData = async () => {
    // TODO: Implement data download
    alert('Data download feature coming soon. Contact support for a manual export.')
  }

  const handleDeleteData = async () => {
    // TODO: Implement data deletion request
    alert(
      'To request data deletion, please contact support@thepsychologyai.com. Your request will be processed within 30 days.'
    )
  }

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login')
    }
  }, [user, loading, mounted, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredPrograms = programSearch
    ? programs.filter(
        (p) =>
          p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
          p.institution.toLowerCase().includes(programSearch.toLowerCase())
      )
    : programs

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and privacy preferences</p>
          </div>
        </div>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Plan</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {userProfile?.subscription_tier?.replace('_', ' + ') || 'Free'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
                Manage Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>Control how your data is used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Tracking Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="personal-tracking" className="text-sm font-medium">
                  Personal Improvement Tracking
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Track your scores, weaknesses, and review queue to personalize your study
                  experience.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saving === 'consent_personal_tracking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {saveSuccess === 'consent_personal_tracking' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                <Switch
                  id="personal-tracking"
                  checked={consentPreferences?.consent_personal_tracking ?? true}
                  onCheckedChange={(checked) =>
                    handleConsentChange('consent_personal_tracking', checked)
                  }
                  disabled={saving === 'consent_personal_tracking'}
                />
              </div>
            </div>

            <Separator />

            {/* AI Insights Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="ai-insights" className="text-sm font-medium">
                  AI-Powered Insights (Recover)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive personalized study recommendations and coaching insights.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saving === 'consent_ai_insights' && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {saveSuccess === 'consent_ai_insights' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                <Switch
                  id="ai-insights"
                  checked={consentPreferences?.consent_ai_insights ?? true}
                  onCheckedChange={(checked) => handleConsentChange('consent_ai_insights', checked)}
                  disabled={saving === 'consent_ai_insights'}
                />
              </div>
            </div>

            <Separator />

            {/* Research Contribution Toggle */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="research-contribution" className="text-sm font-medium">
                    Contribute to Research
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Help improve graduate psychology training by contributing de-identified data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === 'consent_research_contribution' && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {saveSuccess === 'consent_research_contribution' && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  <Switch
                    id="research-contribution"
                    checked={consentPreferences?.consent_research_contribution ?? false}
                    onCheckedChange={(checked) =>
                      handleConsentChange('consent_research_contribution', checked)
                    }
                    disabled={saving === 'consent_research_contribution'}
                  />
                </div>
              </div>

              {/* Expandable info about research */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="research-info" className="border-0">
                  <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-2">
                    <span className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      What data is shared?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-2">
                    <p>
                      <strong>Your privacy is protected:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Your name and email are never shared</li>
                      <li>Data is aggregated (minimum 5 students per group)</li>
                      <li>Only de-identified performance patterns are used</li>
                      <li>You can opt out anytime and request data deletion</li>
                    </ul>
                    <p className="pt-2">
                      <strong>How it helps:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Identifies curriculum gaps in graduate programs</li>
                      <li>Improves EPPP preparation materials</li>
                      <li>Supports evidence-based training improvements</li>
                    </ul>
                    <p className="pt-2 text-[10px]">
                      Compliant with HIPAA, FERPA, and IRB protocols.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Graduate Program Selection (shown when research is enabled) */}
              {consentPreferences?.consent_research_contribution && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Your Graduate Program (Optional)</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Linking your program helps us provide program-specific insights.
                  </p>
                  <Input
                    placeholder="Search programs..."
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={selectedProgram || ''} onValueChange={handleProgramSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPrograms ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                      ) : filteredPrograms.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No programs found. Contact us to add yours.
                        </div>
                      ) : (
                        filteredPrograms.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.institution} - {program.name} ({program.program_type})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Marketing Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="marketing" className="text-sm font-medium">
                  Marketing Communications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive product updates, study tips, and promotional offers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saving === 'consent_marketing_communications' && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {saveSuccess === 'consent_marketing_communications' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                <Switch
                  id="marketing"
                  checked={consentPreferences?.consent_marketing_communications ?? false}
                  onCheckedChange={(checked) =>
                    handleConsentChange('consent_marketing_communications', checked)
                  }
                  disabled={saving === 'consent_marketing_communications'}
                />
              </div>
            </div>

            <Separator />

            {/* Data Actions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Your Data</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadData}>
                  <Download className="w-4 h-4 mr-2" />
                  Download My Data
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Your Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will submit a request to delete all your data from our systems. This
                        action cannot be undone. Your account will be deactivated and all study
                        progress will be permanently removed within 30 days.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteData}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Request Deletion
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Profile Section (shown when research contribution is enabled) */}
        {consentPreferences?.consent_research_contribution && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Research Profile
              </CardTitle>
              <CardDescription>
                Optional information to help with research analysis (all fields optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/dashboard/settings/research-profile')}>
                Edit Research Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
