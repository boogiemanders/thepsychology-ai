'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { providerBioSchema } from '@/lib/matching-schemas'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof providerBioSchema>

export function StepBio() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(providerBioSchema),
    defaultValues: {
      bio_text: '',
      approach_text: '',
      ...(data as Partial<Values>),
    },
  })

  const bioLength = (form.watch('bio_text') ?? '').length
  const approachLength = (form.watch('approach_text') ?? '').length

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
        <FormField control={form.control} name="bio_text" render={({ field }) => (
          <FormItem>
            <FormLabel>Your Bio</FormLabel>
            <p className="text-sm text-muted-foreground">
              Write about yourself, your background, and what clients can expect working with you.
            </p>
            <FormControl>
              <Textarea
                placeholder="Tell potential clients about yourself..."
                className="min-h-[150px]"
                {...field}
              />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground">
              <FormMessage />
              <span>{bioLength}/2000</span>
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name="approach_text" render={({ field }) => (
          <FormItem>
            <FormLabel>Your Therapeutic Approach</FormLabel>
            <p className="text-sm text-muted-foreground">
              Describe how you work with clients. What does a typical session look like?
            </p>
            <FormControl>
              <Textarea
                placeholder="Describe your therapeutic approach..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground">
              <FormMessage />
              <span>{approachLength}/1500</span>
            </div>
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
