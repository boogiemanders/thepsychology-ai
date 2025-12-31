'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Shield, Sparkles, GraduationCap, Mail, Loader2, Info } from 'lucide-react'

interface ConsentModalProps {
  open: boolean
  onClose: () => void
}

export function ConsentModal({ open, onClose }: ConsentModalProps) {
  const { updateConsent, consentPreferences } = useAuth()
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    consent_personal_tracking: true,
    consent_ai_insights: true,
    consent_research_contribution: false,
    consent_marketing_communications: false,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateConsent(preferences)
      onClose()
    } catch (err) {
      console.error('Failed to save consent preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data Preferences
          </DialogTitle>
          <DialogDescription>
            Choose how your data is used. You can change these anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Personal Tracking */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <Label className="text-sm font-medium">Personal Improvement Tracking</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track scores and weaknesses to personalize your study experience
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.consent_personal_tracking}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, consent_personal_tracking: checked })
              }
            />
          </div>

          <Separator />

          {/* AI Insights */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <Label className="text-sm font-medium">AI-Powered Insights</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get personalized study recommendations from Recover
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.consent_ai_insights}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, consent_ai_insights: checked })
              }
            />
          </div>

          <Separator />

          {/* Research Contribution */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5">
                  <GraduationCap className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Help Improve Psychology Training</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Contribute de-identified data to help graduate programs improve
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.consent_research_contribution}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, consent_research_contribution: checked })
                }
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="research-info" className="border-0">
                <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-1 pl-7">
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Learn more about research data
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 ml-7 space-y-2">
                  <p>
                    <strong>Your privacy is protected:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your name and email are never shared</li>
                    <li>Data is aggregated (minimum 5 students per group)</li>
                    <li>Only de-identified performance patterns are used</li>
                    <li>You can opt out anytime</li>
                  </ul>
                  <p className="pt-1">
                    <strong>How it helps:</strong> Identifies curriculum gaps to improve graduate
                    psychology training across programs.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Separator />

          {/* Marketing */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Mail className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <Label className="text-sm font-medium">Study Tips & Updates</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive helpful study tips and product updates
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.consent_marketing_communications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, consent_marketing_communications: checked })
              }
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to show consent modal for users who haven't set preferences
export function useConsentModal() {
  const { user, consentPreferences } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  // Show modal if user is logged in and hasn't set consent preferences
  const shouldShow =
    user && consentPreferences?.is_default && !dismissed

  const dismiss = () => setDismissed(true)

  return { shouldShow, dismiss }
}
