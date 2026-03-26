'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { clientConsentSchema } from '@/lib/matching-schemas'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof clientConsentSchema>

export function StepConsent() {
  const { setStepData, next } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(clientConsentSchema),
    defaultValues: {
      hipaa_consent: false as unknown as true,
      matching_consent: false as unknown as true,
    },
  })

  const onSubmit = async (values: Values) => {
    setStepData(values)
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.access_token) {
      await fetch('/api/client/intake/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(values),
      })
    }
    next()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Before we begin, we need your consent to proceed with the matching process.
        </p>

        <FormField control={form.control} name="hipaa_consent" render={({ field }) => (
          <FormItem className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <FormLabel className="text-base">HIPAA Consent</FormLabel>
                <p className="text-sm text-muted-foreground">
                  I consent to having my health information securely stored and used for therapist
                  matching purposes. My data is encrypted, HIPAA-compliant, and never shared without
                  my explicit permission.
                </p>
              </div>
              <Switch
                checked={field.value === true}
                onCheckedChange={field.onChange}
              />
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="matching_consent" render={({ field }) => (
          <FormItem className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <FormLabel className="text-base">Matching Consent</FormLabel>
                <p className="text-sm text-muted-foreground">
                  I consent to having my preferences and presenting concerns shared with matched
                  therapists so they can determine if they are a good fit. Only therapists you are
                  matched with will see your information.
                </p>
              </div>
              <Switch
                checked={field.value === true}
                onCheckedChange={field.onChange}
              />
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
