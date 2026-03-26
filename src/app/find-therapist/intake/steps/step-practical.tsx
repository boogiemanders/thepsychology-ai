'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { clientPracticalSchema } from '@/lib/matching-schemas'
import { LAUNCH_STATES } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof clientPracticalSchema>

export function StepPractical() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(clientPracticalSchema),
    defaultValues: {
      state_of_residence: undefined,
      telehealth_preference: 'telehealth_only',
      availability_notes: '',
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
        <FormField control={form.control} name="state_of_residence" render={({ field }) => (
          <FormItem>
            <FormLabel>State of Residence</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {LAUNCH_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'CA' ? 'California' : 'New York'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="telehealth_preference" render={({ field }) => (
          <FormItem>
            <FormLabel>Session format preference</FormLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2 mt-2">
              {[
                { value: 'telehealth_only', label: 'Telehealth only (video sessions)' },
                { value: 'in_person_only', label: 'In-person only' },
                { value: 'no_preference', label: 'No preference' },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`tele-${opt.value}`} />
                  <Label htmlFor={`tele-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="availability_notes" render={({ field }) => (
          <FormItem>
            <FormLabel>When are you generally available? (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g. Weekday evenings after 6pm, Saturday mornings..."
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
