'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { providerStyleSchema } from '@/lib/matching-schemas'
import { STYLE_LABELS } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof providerStyleSchema>

const STYLE_KEYS = Object.keys(STYLE_LABELS) as (keyof typeof STYLE_LABELS)[]

export function StepStyle() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(providerStyleSchema),
    defaultValues: {
      style_directive: 5,
      style_present_focused: 5,
      style_insight_behavioral: 5,
      style_warmth_professional: 5,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <p className="text-sm text-muted-foreground">
          Rate your therapeutic style on each dimension. This helps us match you with clients
          who are looking for your approach.
        </p>

        {STYLE_KEYS.map((key) => {
          const label = STYLE_LABELS[key]
          return (
            <FormField key={key} control={form.control} name={key} render={({ field }) => (
              <FormItem>
                <FormLabel>{label.description}</FormLabel>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{label.low}</span>
                    <span>{label.high}</span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value ?? 5]}
                    onValueChange={([val]) => field.onChange(val)}
                  />
                  <div className="text-center text-sm font-medium">{field.value ?? 5}</div>
                </div>
                <FormMessage />
              </FormItem>
            )} />
          )
        })}

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
