// Google Ads API client factory. Reads credentials from .env.local and returns
// a Customer handle scoped to our single ad account (EPPP Prep - Search - US+CA).
// Used by the other scripts in this folder. See README.md for how to generate
// the OAuth refresh token and the rest of the credentials.

import { GoogleAdsApi } from "google-ads-api"
import { config } from "dotenv"

config({ path: ".env.local" })

function req(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(
      `Missing required env var: ${name} (see scripts/google-ads/README.md)`
    )
    process.exit(1)
  }
  return v
}

export function getCustomer() {
  const client = new GoogleAdsApi({
    client_id: req("GOOGLE_ADS_CLIENT_ID"),
    client_secret: req("GOOGLE_ADS_CLIENT_SECRET"),
    developer_token: req("GOOGLE_ADS_DEVELOPER_TOKEN"),
  })

  return client.Customer({
    customer_id: req("GOOGLE_ADS_CUSTOMER_ID"), // 10 digits, no dashes
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined, // manager id, only if account is under an MCC
    refresh_token: req("GOOGLE_ADS_REFRESH_TOKEN"),
  })
}
