'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { clientHistorySchema } from '@/lib/matching-schemas'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof clientHistorySchema>

export function StepHistory() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(clientHistorySchema),
    defaultValues: {
      has_previous_therapy: false,
      previous_therapy_count: undefined,
      what_worked_text: '',
      what_didnt_work_text: '',
      ...(data as Partial<Values>),
    },
  })

  const hasPrevious = form.watch('has_previous_therapy')

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
        <FormField control={form.control} name="has_previous_therapy" render={({ field }) => (
          <FormItem>
            <FormLabel>Have you been to therapy before?</FormLabel>
            <RadioGroup
              value={field.value ? 'yes' : 'no'}
              onValueChange={(v) => field.onChange(v === 'yes')}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="prev-yes" />
                <Label htmlFor="prev-yes">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="prev-no" />
                <Label htmlFor="prev-no">No</Label>
              </div>
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )} />

        {hasPrevious && (
          <>
            <FormField control={form.control} name="previous_therapy_count" render={({ field }) => (
              <FormItem>
                <FormLabel>How many therapists have you seen?</FormLabel>
                <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="flex gap-4 mt-2">
                  {['1-3', '4-10', '10+'].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`count-${opt}`} />
                      <Label htmlFor={`count-${opt}`}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="what_worked_text" render={({ field }) => (
              <FormItem>
                <FormLabel>What worked well in previous therapy? (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g. Having homework between sessions, feeling heard..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="what_didnt_work_text" render={({ field }) => (
              <FormItem>
                <FormLabel>What didn&apos;t work? (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g. Felt too passive, didn't feel a connection..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
