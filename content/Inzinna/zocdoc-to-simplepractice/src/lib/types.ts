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
