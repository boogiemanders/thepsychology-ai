'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { providerPracticalSchema } from '@/lib/matching-schemas'
import { INSURANCE_PAYERS, LAUNCH_STATES } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof providerPracticalSchema>

export function StepPractical() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(providerPracticalSchema),
    defaultValues: {
      insurance_networks: [],
      accepts_self_pay: true,
      self_pay_rate_cents: undefined,
      sliding_scale_available: false,
      sliding_scale_min_cents: undefined,
      telehealth_states: [],
      ...(data as Partial<Values>),
    },
  })

  const acceptsSelfPay = form.watch('accepts_self_pay')
  const slidingScale = form.watch('sliding_scale_available')

  const onSubmit = async (values: Values) => {
    // Convert dollar inputs to cents
    const payload = {
      ...values,
      self_pay_rate_cents: values.self_pay_rate_cents ? Math.round(values.self_pay_rate_cents) : undefined,
      sliding_scale_min_cents: values.sliding_scale_min_cents ? Math.round(values.sliding_scale_min_cents) : undefined,
    }
    setStepData(payload)
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.access_token) {
      await fetch('/api/provider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.access_token}` },
        body: JSON.stringify(payload),
      })
    }
    next()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="insurance_networks" render={({ field }) => (
          <FormItem>
            <FormLabel>Insurance Networks</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {INSURANCE_PAYERS.map((payer) => (
                <label key={payer} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    checked={field.value.includes(payer)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? [...field.value, payer] : field.value.filter((v) => v !== payer))
                    }
                  />
                  {payer}
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="accepts_self_pay" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel>Accept Self-Pay Clients</FormLabel>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        {acceptsSelfPay && (
          <FormField control={form.control} name="self_pay_rate_cents" render={({ field }) => (
            <FormItem>
              <FormLabel>Self-Pay Rate (per session, in cents)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. 15000 for $150"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="sliding_scale_available" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel>Sliding Scale Available</FormLabel>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        {slidingScale && (
          <FormField control={form.control} name="sliding_scale_min_cents" render={({ field }) => (
            <FormItem>
              <FormLabel>Sliding Scale Minimum (in cents)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. 5000 for $50"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="telehealth_states" render={({ field }) => (
          <FormItem>
            <FormLabel>Telehealth States</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">Select states where you offer telehealth services</p>
            <div className="flex gap-4">
              {LAUNCH_STATES.map((state) => (
                <label key={state} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    checked={field.value.includes(state)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? [...field.value, state] : field.value.filter((v) => v !== state))
                    }
                  />
                  {state}
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
