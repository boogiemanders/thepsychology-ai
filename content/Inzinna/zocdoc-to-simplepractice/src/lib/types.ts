export interface CapturedClient {
  firstName: string
  lastName: string
  dob: string
  phone: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }

  insuranceCompany: string
  memberId: string
  groupNumber: string
  subscriberName: string
  subscriberRelationship: string
  copay: string
  insuranceCardFront: string // base64 data URL
  insuranceCardBack: string // base64 data URL

  appointmentDate: string // ISO date
  appointmentTime: string // e.g., "9:00 AM"
  serviceType: string
  reasonForVisit: string

  presentingConcerns: string
  medications: string
  priorTreatment: string

  capturedAt: string // ISO timestamp
  status: {
    clientCreated: boolean
    appointmentSet: boolean
    insuranceAdded: boolean
    vobEmailSent: boolean
  }
}

export const DEFAULT_STATUS: CapturedClient['status'] = {
  clientCreated: false,
  appointmentSet: false,
  insuranceAdded: false,
  vobEmailSent: false,
}

export interface ProviderPreferences {
  providerFirstName: string
  providerLastName: string
  defaultLocation: string
  firstVisitCPT: string
  followUpCPT: string
  vobTo: string[]
  vobCc: string[]
  vobSignature: string
}

export const DEFAULT_PREFERENCES: ProviderPreferences = {
  providerFirstName: 'Anders',
  providerLastName: 'Chan',
  defaultLocation: 'Video Office',
  firstVisitCPT: '90791',
  followUpCPT: '90837',
  vobTo: ['david@sosapartners.com', 'support@sosapartners.com'],
  vobCc: ['greg@drinzinna.com', 'carlos@drinzinna.com'],
  vobSignature: `Regards,
Anders

Anders H. Chan, PsyD (he/him)
Postdoctoral Fellow
DrAnders@DrInzinna.com
1-516-226-0379`,
}
