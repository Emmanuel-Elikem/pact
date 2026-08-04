import type { VercelRequest, VercelResponse } from '@vercel/node'

const MODEL = 'gemini-flash-latest'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const CAMPAIGN_SYSTEM = `You are Trendit's campaign manager for startup brands.
Given a plain-language brand/product/goal description, return ONLY valid JSON (no markdown) with this shape:
{
  "title": string,
  "description": string,
  "campaignType": "Product launch" | "Brand awareness" | "App install" | "Event promo" | "Affiliate / sales" | "Education series",
  "category": "Tech" | "Gaming" | "Fashion" | "Finance" | "Lifestyle" | "Education" | "Food",
  "reward": string (USD number like "100"),
  "minViews": string (number like "25000"),
  "days": string (number like "7"),
  "platforms": string[] (subset of TikTok, Instagram, YouTube, X),
  "deliverables": string,
  "hashtags": string,
  "wantStyle": string,
  "avoidStyle": string,
  "talkingPoints": string,
  "dos": string,
  "donts": string,
  "selectionMode": "brand_picks" | "open",
  "selectionHint": string,
  "nextTips": string[] (2-3 short tips after create)
}
Keep copy concise and practical. Prefer brand_picks for most startups.`

const CREATOR_SYSTEM = `You are a helpful Trendit coach for creators applying to brand campaigns.
Give short, practical tips (under 180 words) on how to apply and what to submit.
Use plain language, 3-5 bullet points. No JSON.`

type Mode = 'campaign' | 'creator'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return res.status(503).json({
      error: 'AI unavailable — set GEMINI_API_KEY',
      unavailable: true,
    })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  const message = String(body.message || '').trim()
  const mode: Mode = body.mode === 'creator' ? 'creator' : 'campaign'
  const context = body.context ? String(body.context) : ''

  if (!message) {
    return res.status(400).json({ error: 'message required' })
  }

  const system = mode === 'creator' ? CREATOR_SYSTEM : CAMPAIGN_SYSTEM
  const userText = context
    ? `Context:\n${context}\n\nUser:\n${message}`
    : message

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: mode === 'campaign' ? 2048 : 512,
          ...(mode === 'campaign' ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    })

    const data = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
      error?: { message?: string }
    }

    if (!r.ok) {
      return res.status(502).json({
        error: data.error?.message || 'Gemini request failed',
      })
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''

    if (mode === 'creator') {
      return res.status(200).json({ mode, reply: text.trim() })
    }

    let draft: Record<string, unknown>
    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      draft = JSON.parse(cleaned)
    } catch {
      return res.status(502).json({ error: 'AI returned invalid campaign JSON', raw: text })
    }

    return res.status(200).json({ mode, draft, reply: summarizeDraft(draft) })
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'AI failed',
    })
  }
}

function summarizeDraft(d: Record<string, unknown>): string {
  const title = String(d.title || 'Campaign draft')
  const reward = String(d.reward || '?')
  const days = String(d.days || '?')
  return `Draft ready: “${title}” — $${reward} reward, ${days} days. Tap Use this draft to prefill the form.`
}
