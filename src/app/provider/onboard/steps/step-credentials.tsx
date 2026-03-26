'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard, WizardNavigation } from '@/components/wizard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { providerCredentialsSchema } from '@/lib/matching-schemas'
import { LAUNCH_STATES } from '@/lib/matching-constants'
import { supabase } from '@/lib/supabase'

type Values = z.infer<typeof providerCredentialsSchema>

export function StepCredentials() {
  const { setStepData, next, data } = useWizard()
  const form = useForm<Values>({
    resolver: zodResolver(providerCredentialsSchema),
    defaultValues: {
      license_type: '',
      license_number: '',
      license_state: undefined,
      npi_number: '',
      multi_state_licensed: false,
      licensed_states: [],
      ...(data as Partial<Values>),
    },
  })

  const multiState = form.watch('multi_state_licensed')

  const onSubmit = async (values: Values) => {
    setStepData(values)
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.access_token) {
      await fetch('/api/provider/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(values),
      })
    }
    next()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="license_type" render={({ field }) => (
          <FormItem>
            <FormLabel>License Type</FormLabel>
            <FormControl><Input placeholder="e.g. LCSW, PhD, PsyD, LMFT, LPC" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="license_number" render={({ field }) => (
          <FormItem>
            <FormLabel>License Number</FormLabel>
            <FormControl><Input placeholder="Your license number" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="license_state" render={({ field }) => (
          <FormItem>
            <FormLabel>Primary License State</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {LAUNCH_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="npi_number" render={({ field }) => (
          <FormItem>
            <FormLabel>NPI Number (optional)</FormLabel>
            <FormControl><Input placeholder="10-digit NPI" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="multi_state_licensed" render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="font-normal">I am licensed in multiple states</FormLabel>
          </FormItem>
        )} />

        {multiState && (
          <div className="space-y-2 pl-6">
            <Label className="text-sm text-muted-foreground">Select all states where you are licensed</Label>
            <div className="flex gap-4">
              {LAUNCH_STATES.map((state) => (
                <label key={state} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={(form.watch('licensed_states') ?? []).includes(state)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('licensed_states') ?? []
                      form.setValue(
                        'licensed_states',
                        checked ? [...current, state] : current.filter((s) => s !== state)
                      )
                    }}
                  />
                  {state}
                </label>
              ))}
            </div>
          </div>
        )}

        <WizardNavigation submitForm />
      </form>
    </Form>
  )
}
