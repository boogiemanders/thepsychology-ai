'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { providerSpecializationsSchema } from '@/lib/matching-schemas'
import { MODALITIES, CONDITIONS, POPULATIONS } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof providerSpecializationsSchema>

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

export function StepSpecializations() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(providerSpecializationsSchema),
    defaultValues: {
      modalities: [],
      conditions_treated: [],
      populations_served: [],
      ...(data as Partial<Values>),
    },
  })

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
        <FormField control={form.control} name="modalities" render={({ field }) => (
          <FormItem>
            <FormLabel>Therapy Modalities</FormLabel>
            <CheckboxGrid options={MODALITIES} selected={field.value} onChange={field.onChange} />
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Other modality..."
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
            {field.value.filter((m: string) => !(MODALITIES as readonly string[]).includes(m)).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {field.value.filter((m: string) => !(MODALITIES as readonly string[]).includes(m)).map((m: string) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {m}
                    <button type="button" className="hover:text-destructive" onClick={() => field.onChange(field.value.filter((v: string) => v !== m))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="conditions_treated" render={({ field }) => (
          <FormItem>
            <FormLabel>Conditions Treated</FormLabel>
            <CheckboxGrid options={CONDITIONS} selected={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="populations_served" render={({ field }) => (
          <FormItem>
            <FormLabel>Populations Served</FormLabel>
            <CheckboxGrid options={POPULATIONS} selected={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
