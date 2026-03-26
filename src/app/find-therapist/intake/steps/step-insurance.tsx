'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientInsuranceSchema } from '@/lib/matching-schemas'
import { INSURANCE_PAYERS } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof clientInsuranceSchema>

export function StepInsurance() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(clientInsuranceSchema),
    defaultValues: {
      has_insurance: true,
      insurance_payer_name: '',
      insurance_member_id: '',
      insurance_group_number: '',
      insurance_plan_name: '',
      interested_in_self_pay: false,
      max_self_pay_rate_cents: undefined,
      ...(data as Partial<Values>),
    },
  })

  const hasInsurance = form.watch('has_insurance')
  const selfPay = form.watch('interested_in_self_pay')

  const onSubmit = async (values: Values) => {
    const payload = {
      ...values,
      max_self_pay_rate_cents: values.max_self_pay_rate_cents
        ? Math.round(values.max_self_pay_rate_cents)
        : undefined,
    }
    setStepData(payload)
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.access_token) {
      await fetch('/api/client/intake', {
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
        <FormField control={form.control} name="has_insurance" render={({ field }) => (
          <FormItem>
            <FormLabel>Do you have health insurance?</FormLabel>
            <RadioGroup
              value={field.value ? 'yes' : 'no'}
              onValueChange={(v) => field.onChange(v === 'yes')}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="ins-yes" />
                <Label htmlFor="ins-yes">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="ins-no" />
                <Label htmlFor="ins-no">No</Label>
              </div>
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )} />

        {hasInsurance && (
          <>
            <FormField control={form.control} name="insurance_payer_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Provider</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select your insurance" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INSURANCE_PAYERS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="insurance_member_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Member ID</FormLabel>
                <FormControl><Input placeholder="Found on your insurance card" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="insurance_group_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Group Number (optional)</FormLabel>
                <FormControl><Input placeholder="If listed on your card" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="insurance_plan_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name (optional)</FormLabel>
                <FormControl><Input placeholder="e.g. PPO, HMO, EPO" {...field} /></FormControl>
              </FormItem>
            )} />
          </>
        )}

        <FormField control={form.control} name="interested_in_self_pay" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel>Interested in self-pay options</FormLabel>
              <p className="text-sm text-muted-foreground">See therapists who offer out-of-pocket rates</p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormItem>
        )} />

        {selfPay && (
          <FormField control={form.control} name="max_self_pay_rate_cents" render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum per-session budget (in cents)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. 20000 for $200"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
