'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { clientConcernsSchema } from '@/lib/matching-schemas'
import { CONDITIONS } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof clientConcernsSchema>

export function StepConcerns() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(clientConcernsSchema),
    defaultValues: {
      conditions_seeking_help: [],
      concern_severity: 5,
      presenting_concerns_text: '',
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
        <FormField control={form.control} name="conditions_seeking_help" render={({ field }) => (
          <FormItem>
            <FormLabel>What are you seeking help with?</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CONDITIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    checked={field.value.includes(c)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? [...field.value, c] : field.value.filter((v) => v !== c))
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="concern_severity" render={({ field }) => (
          <FormItem>
            <FormLabel>How much is this affecting your daily life?</FormLabel>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Severe</span>
              </div>
              <Slider
                min={1} max={10} step={1}
                value={[field.value]}
                onValueChange={([val]) => field.onChange(val)}
              />
              <div className="text-center text-sm font-medium">{field.value}/10</div>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="presenting_concerns_text" render={({ field }) => (
          <FormItem>
            <FormLabel>Describe what brings you to therapy (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="In your own words, what's going on..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
