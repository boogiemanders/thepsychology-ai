import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  const logoUrl = new URL("/images/logo.png", "https://www.thepsychology.ai")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl.toString()}
          alt="thePsychology.ai"
          width={450}
          height={450}
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
