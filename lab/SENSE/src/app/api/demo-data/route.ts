import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Create demo clients
    const client1 = await prisma.client.create({
      data: {
        name: 'Alex M.',
        age: 8,
        settingDefault: 'clinic',
        sessions: {
          create: [
            {
              somaticRating: 4,
              emotionalRating: 3,
              neurologicalRating: 5,
              socialRating: 2,
              environmentalRating: 4,
              stateTag: 'hyper',
              bodySystem: 'musculoskeletal',
              context: 'clinic',
              sensoryModifiers: JSON.stringify(['vestibular_seeking', 'proprioceptive_seeking']),
              hypothesis1: 'Sensory seeking behaviors may be an attempt to regulate an underresponsive proprioceptive system.',
              hypothesis2: 'Environmental sensitivities might contribute to hyperarousal in busy settings.',
              targets: JSON.stringify(['Reduce fidgeting during seated tasks', 'Improve transition tolerance']),
              interventionId: 'sensory_diet',
              interventionName: 'Sensory Diet Planning',
              measure: 'Fidget frequency tracking',
              practiceFrequency: 'daily',
            }
          ]
        }
      }
    })

    const client2 = await prisma.client.create({
      data: {
        name: 'Jordan T.',
        age: 34,
        settingDefault: 'clinic',
        sessions: {
          create: [
            {
              somaticRating: 5,
              emotionalRating: 4,
              neurologicalRating: 3,
              socialRating: 3,
              environmentalRating: 2,
              stateTag: 'mixed',
              bodySystem: 'gi',
              context: 'clinic',
              sensoryModifiers: JSON.stringify(['interoception_high', 'tactile_defensive']),
              hypothesis1: 'High interoceptive sensitivity may amplify awareness of GI distress, contributing to anxiety cycle.',
              hypothesis2: 'Tactile defensiveness might contribute to social withdrawal and difficulty with physical affection.',
              targets: JSON.stringify(['Reduce GI-anxiety cycle', 'Increase comfort with physical proximity']),
              interventionId: 'somatic_grounding',
              interventionName: 'Somatic Grounding',
              measure: 'Weekly distress rating',
              practiceFrequency: '3x_week',
            }
          ]
        }
      }
    })

    const client3 = await prisma.client.create({
      data: {
        name: 'Sam K.',
        age: 12,
        settingDefault: 'school',
      }
    })

    return NextResponse.json({
      success: true,
      clients: [client1, client2, client3]
    })
  } catch (error) {
    console.error('Failed to create demo data:', error)
    return NextResponse.json(
      { error: 'Failed to create demo data' },
      { status: 500 }
    )
  }
}
