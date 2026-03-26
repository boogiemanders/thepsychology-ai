'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { providerCulturalSchema } from '@/lib/matching-schemas'
import { Input } from '@/components/ui/input'
import { LANGUAGES, FAITH_TRADITIONS, RACIAL_CULTURAL_FOCUS } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof providerCulturalSchema>

function CheckboxGrid({
  options,
  selected,
  onChange,
}: {
  options: readonly string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50">
          <Checkbox
            checked={selected.includes(opt)}
            onCheckedChange={(checked) =>
              onChange(checked ? [...selected, opt] : selected.filter((v) => v !== opt))
            }
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

export function StepCultural() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(providerCulturalSchema),
    defaultValues: {
      languages_spoken: ['English'],
      lgbtq_affirming: false,
      faith_integrated: false,
      faith_traditions: [],
      racial_cultural_focus: [],
      ...(data as Partial<Values>),
    },
  })

  const faithIntegrated = form.watch('faith_integrated')

  const onSubmit = async (values: Values) => {
    setStepData(values)
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.access_token) {
      await fetch('/api/provider/profile', {
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
        <FormField control={form.control} name="languages_spoken" render={({ field }) => (
          <FormItem>
            <FormLabel>Languages Spoken</FormLabel>
            <CheckboxGrid options={LANGUAGES} selected={field.value} onChange={field.onChange} />
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Other language..."
                className="max-w-xs h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = e.currentTarget.value.trim()
                    if (val && !field.value.includes(val)) {
                      field.onChange([...field.value, val])
                      e.currentTarget.value = ''
                    }
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">Press Enter to add</span>
            </div>
            {field.value.filter((l: string) => !(LANGUAGES as readonly string[]).includes(l)).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {field.value.filter((l: string) => !(LANGUAGES as readonly string[]).includes(l)).map((l: string) => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {l}
                    <button type="button" className="hover:text-destructive" onClick={() => field.onChange(field.value.filter((v: string) => v !== l))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="lgbtq_affirming" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel>LGBTQ+ Affirming</FormLabel>
              <p className="text-sm text-muted-foreground">I provide affirming care for LGBTQ+ clients</p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        <FormField control={form.control} name="faith_integrated" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel>Faith-Integrated Therapy</FormLabel>
              <p className="text-sm text-muted-foreground">I offer faith-integrated or spiritually-informed therapy</p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        {faithIntegrated && (
          <FormField control={form.control} name="faith_traditions" render={({ field }) => (
            <FormItem>
              <FormLabel>Faith Traditions</FormLabel>
              <CheckboxGrid options={FAITH_TRADITIONS} selected={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="racial_cultural_focus" render={({ field }) => (
          <FormItem>
            <FormLabel>Racial/Cultural Focus Areas (optional)</FormLabel>
            <CheckboxGrid options={RACIAL_CULTURAL_FOCUS} selected={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
