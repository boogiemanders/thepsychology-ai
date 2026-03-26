'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { FormControl } from '@/components/ui/form'
import { clientPreferencesSchema } from '@/lib/matching-schemas'
import { MODALITIES, STYLE_LABELS } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof clientPreferencesSchema>

const STYLE_KEYS = ['pref_style_directive', 'pref_style_present_focused', 'pref_style_insight_behavioral', 'pref_style_warmth_professional'] as const
const STYLE_MAP: Record<string, keyof typeof STYLE_LABELS> = {
  pref_style_directive: 'style_directive',
  pref_style_present_focused: 'style_present_focused',
  pref_style_insight_behavioral: 'style_insight_behavioral',
  pref_style_warmth_professional: 'style_warmth_professional',
}

export function StepPreferences() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(clientPreferencesSchema),
    defaultValues: {
      preferred_modalities: [],
      preferred_therapist_gender: 'no_preference',
      preferred_therapist_age: 'no_preference',
      pref_style_directive: 5,
      pref_style_present_focused: 5,
      pref_style_insight_behavioral: 5,
      pref_style_warmth_professional: 5,
      lgbtq_affirming_required: false,
      faith_integrated_preferred: false,
      cultural_background: '',
      ...(data as Partial<Values>),
    },
  })

  const onSubmit = async (values: Values) => {
    setStepData(values)
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.access_token) {
      await fetch('/api/client/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.access_token}` },
        body: JSON.stringify(values),
      })
    }
    next()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="preferred_modalities" render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred therapy approaches (optional)</FormLabel>
            <p className="text-xs text-muted-foreground mb-2">Not sure? Skip this — we&apos;ll match based on your other preferences.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {MODALITIES.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    checked={field.value.includes(m)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? [...field.value, m] : field.value.filter((v) => v !== m))
                    }
                  />
                  {m}
                </label>
              ))}
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name="preferred_therapist_gender" render={({ field }) => (
          <FormItem>
            <FormLabel>Therapist gender preference</FormLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-4 mt-2">
              {[
                { value: 'no_preference', label: 'No preference' },
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'nonbinary', label: 'Nonbinary' },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} />
                  <Label htmlFor={`gender-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormItem>
        )} />

        <FormField control={form.control} name="preferred_therapist_age" render={({ field }) => (
          <FormItem>
            <FormLabel>Therapist age preference</FormLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-4 mt-2">
              {[
                { value: 'no_preference', label: 'No preference' },
                { value: '25-35', label: '25-35' },
                { value: '35-50', label: '35-50' },
                { value: '50+', label: '50+' },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`age-${opt.value}`} />
                  <Label htmlFor={`age-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormItem>
        )} />

        <div className="space-y-6">
          <p className="text-sm font-medium">What kind of therapy style do you prefer?</p>
          {STYLE_KEYS.map((key) => {
            const labelKey = STYLE_MAP[key]
            const label = STYLE_LABELS[labelKey]
            return (
              <FormField key={key} control={form.control} name={key} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{label.description}</FormLabel>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{label.low}</span>
                      <span>{label.high}</span>
                    </div>
                    <Slider
                      min={1} max={10} step={1}
                      value={[field.value ?? 5]}
                      onValueChange={([val]) => field.onChange(val)}
                    />
                  </div>
                </FormItem>
              )} />
            )
          })}
        </div>

        <FormField control={form.control} name="lgbtq_affirming_required" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <FormLabel>LGBTQ+ affirming therapist required</FormLabel>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        <FormField control={form.control} name="faith_integrated_preferred" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <FormLabel>Prefer faith-integrated therapy</FormLabel>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        <FormField control={form.control} name="cultural_background" render={({ field }) => (
          <FormItem>
            <FormLabel>Cultural background (optional)</FormLabel>
            <FormControl><Input placeholder="Anything you'd like us to know" {...field} /></FormControl>
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
