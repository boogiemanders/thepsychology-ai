'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2, Check, GraduationCap, User, BookOpen, BarChart3 } from 'lucide-react'

const PRACTICUM_SETTINGS = [
  { value: 'hospital', label: 'Hospital/Medical Center' },
  { value: 'community_mental_health', label: 'Community Mental Health Center' },
  { value: 'private_practice', label: 'Private Practice' },
  { value: 'university_clinic', label: 'University Counseling Center' },
  { value: 'va', label: 'VA Medical Center' },
  { value: 'forensic', label: 'Forensic/Correctional' },
  { value: 'school', label: 'School Setting' },
  { value: 'substance_abuse', label: 'Substance Abuse Treatment' },
  { value: 'other', label: 'Other' },
]

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+']
const STUDY_TIMES = [
  { value: 'morning', label: 'Morning (6am-12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm-6pm)' },
  { value: 'evening', label: 'Evening (6pm-10pm)' },
  { value: 'night', label: 'Night (10pm-6am)' },
  { value: 'varies', label: 'Varies' },
]

export default function ResearchProfilePage() {
  const router = useRouter()
  const { user, consentPreferences, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profile, setProfile] = useState({
    graduate_program_name: '',
    graduate_program_type: '',
    graduation_year: '',
    program_accreditation: '',
    undergraduate_major: '',
    years_clinical_experience: '',
    practicum_settings: [] as string[],
    self_assessed_readiness: '',
    previous_exam_attempts: '',
    study_hours_per_week: '',
    preferred_study_time: '',
    age_range: '',
    gender: '',
    first_generation_graduate: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && consentPreferences?.consent_research_contribution) {
      fetchProfile()
    }
  }, [user, consentPreferences?.consent_research_contribution])

  const fetchProfile = async () => {
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch('/api/research/profile', {
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile({
            graduate_program_name: data.profile.graduate_program_name || '',
            graduate_program_type: data.profile.graduate_program_type || '',
            graduation_year: data.profile.graduation_year?.toString() || '',
            program_accreditation: data.profile.program_accreditation || '',
            undergraduate_major: data.profile.undergraduate_major || '',
            years_clinical_experience: data.profile.years_clinical_experience?.toString() || '',
            practicum_settings: data.profile.practicum_settings || [],
            self_assessed_readiness: data.profile.self_assessed_readiness?.toString() || '',
            previous_exam_attempts: data.profile.previous_exam_attempts?.toString() || '',
            study_hours_per_week: data.profile.study_hours_per_week?.toString() || '',
            preferred_study_time: data.profile.preferred_study_time || '',
            age_range: data.profile.age_range || '',
            gender: data.profile.gender || '',
            first_generation_graduate: data.profile.first_generation_graduate || false,
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const { data: session } = await supabase.auth.getSession()
      const response = await fetch('/api/research/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          ...profile,
          graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
          years_clinical_experience: profile.years_clinical_experience
            ? parseInt(profile.years_clinical_experience)
            : null,
          self_assessed_readiness: profile.self_assessed_readiness
            ? parseInt(profile.self_assessed_readiness)
            : null,
          previous_exam_attempts: profile.previous_exam_attempts
            ? parseInt(profile.previous_exam_attempts)
            : null,
          study_hours_per_week: profile.study_hours_per_week
            ? parseInt(profile.study_hours_per_week)
            : null,
        }),
      })
      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePracticumChange = (value: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      practicum_settings: checked
        ? [...prev.practicum_settings, value]
        : prev.practicum_settings.filter((s) => s !== value),
    }))
  }

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login')
    }
  }, [user, loading, mounted, router])

  // Redirect if research contribution is not enabled
  useEffect(() => {
    if (mounted && !loading && user && consentPreferences && !consentPreferences.consent_research_contribution) {
      router.push('/dashboard/settings')
    }
  }, [mounted, loading, user, consentPreferences, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user || !consentPreferences?.consent_research_contribution) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Research Profile</h1>
            <p className="text-muted-foreground">
              Help improve psychology training (all fields optional)
            </p>
          </div>
        </div>

        {/* Graduate Program Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5" />
              Graduate Program
            </CardTitle>
            <CardDescription>Information about your doctoral program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-name">Program/Institution Name</Label>
                <Input
                  id="program-name"
                  placeholder="e.g., University of California, Los Angeles"
                  value={profile.graduate_program_name}
                  onChange={(e) =>
                    setProfile({ ...profile, graduate_program_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-type">Program Type</Label>
                <Select
                  value={profile.graduate_program_type}
                  onValueChange={(v) => setProfile({ ...profile, graduate_program_type: v })}
                >
                  <SelectTrigger id="program-type">
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
                <Label htmlFor="graduation-year">Graduation Year</Label>
                <Input
                  id="graduation-year"
                  type="number"
                  placeholder="e.g., 2024"
                  min="1980"
                  max="2035"
                  value={profile.graduation_year}
                  onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accreditation">Accreditation</Label>
                <Select
                  value={profile.program_accreditation}
                  onValueChange={(v) => setProfile({ ...profile, program_accreditation: v })}
                >
                  <SelectTrigger id="accreditation">
                    <SelectValue placeholder="Select accreditation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APA">APA Accredited</SelectItem>
                    <SelectItem value="PCSAS">PCSAS Accredited</SelectItem>
                    <SelectItem value="Both">Both APA & PCSAS</SelectItem>
                    <SelectItem value="Neither">Neither</SelectItem>
                    <SelectItem value="Unknown">Not Sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Training Background */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Pre-Training Background
            </CardTitle>
            <CardDescription>Your experience before/during training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="undergrad-major">Undergraduate Major</Label>
                <Input
                  id="undergrad-major"
                  placeholder="e.g., Psychology"
                  value={profile.undergraduate_major}
                  onChange={(e) => setProfile({ ...profile, undergraduate_major: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinical-experience">Years of Clinical Experience</Label>
                <Input
                  id="clinical-experience"
                  type="number"
                  placeholder="e.g., 3"
                  min="0"
                  max="50"
                  value={profile.years_clinical_experience}
                  onChange={(e) =>
                    setProfile({ ...profile, years_clinical_experience: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Practicum/Internship Settings (select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {PRACTICUM_SETTINGS.map((setting) => (
                  <div key={setting.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`practicum-${setting.value}`}
                      checked={profile.practicum_settings.includes(setting.value)}
                      onCheckedChange={(checked) =>
                        handlePracticumChange(setting.value, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`practicum-${setting.value}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {setting.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              Self-Assessment
            </CardTitle>
            <CardDescription>Your preparation and study habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="readiness">Self-Assessed Readiness (1-10)</Label>
                <Input
                  id="readiness"
                  type="number"
                  placeholder="1 = not ready, 10 = very ready"
                  min="1"
                  max="10"
                  value={profile.self_assessed_readiness}
                  onChange={(e) =>
                    setProfile({ ...profile, self_assessed_readiness: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous-attempts">Previous EPPP Attempts</Label>
                <Input
                  id="previous-attempts"
                  type="number"
                  placeholder="0 if first attempt"
                  min="0"
                  max="10"
                  value={profile.previous_exam_attempts}
                  onChange={(e) =>
                    setProfile({ ...profile, previous_exam_attempts: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study-hours">Study Hours Per Week</Label>
                <Input
                  id="study-hours"
                  type="number"
                  placeholder="e.g., 15"
                  min="0"
                  max="100"
                  value={profile.study_hours_per_week}
                  onChange={(e) => setProfile({ ...profile, study_hours_per_week: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study-time">Preferred Study Time</Label>
                <Select
                  value={profile.preferred_study_time}
                  onValueChange={(v) => setProfile({ ...profile, preferred_study_time: v })}
                >
                  <SelectTrigger id="study-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_TIMES.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demographics (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Demographics (Optional)
            </CardTitle>
            <CardDescription>
              Helps identify disparities in training access and outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age-range">Age Range</Label>
                <Select
                  value={profile.age_range}
                  onValueChange={(v) => setProfile({ ...profile, age_range: v })}
                >
                  <SelectTrigger id="age-range">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  placeholder="Your gender identity"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="first-gen"
                checked={profile.first_generation_graduate}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, first_generation_graduate: checked as boolean })
                }
              />
              <label
                htmlFor="first-gen"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                First-generation graduate student
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saveSuccess && (
            <span className="text-sm text-green-500 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Saved successfully
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}
