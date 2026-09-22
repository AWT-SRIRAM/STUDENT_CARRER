import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type QuizResponse = {
  questions: QuizQuestion[];
  source: 'groq' | 'gemini' | 'none';
};

// Simple in-memory rate limiter. Resets on deploy / cold start.
// Good enough to stop casual abuse; not bulletproof.
const WINDOW_MS = 60_000;      // 1 minute
const MAX_PER_WINDOW = 3;      // 3 quiz generations per minute per user
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_PER_WINDOW) return false;
  bucket.count++;
  return true;
}

async function getCallerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

function buildPrompt(topics: string[], count: number): string {
  return `You are an expert TNPSC Group IV exam question setter.

Generate exactly ${count} multiple-choice questions based ONLY on the following topics:

${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Exactly one option must be correct
- Questions must be in English
- Test conceptual understanding, not rote memorization
- Difficulty: SSLC standard (10th grade)
- Include a brief 1-sentence explanation for the correct answer

Return ONLY valid JSON in this exact format, no markdown, no code fences, no extra text:

{
  "questions": [
    {
      "question": "Full question text here?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}`;
}

function parseQuizJSON(raw: string): QuizQuestion[] | null {
  try {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const data = JSON.parse(cleaned);
    if (!Array.isArray(data.questions)) return null;

    const parsed: QuizQuestion[] = [];
    for (const q of data.questions) {
      if (
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === 'number' &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4 &&
        typeof q.explanation === 'string'
      ) {
        parsed.push({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        });
      }
    }
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

async function tryGroq(prompt: string): Promise<QuizQuestion[] | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: 'You return only valid JSON. No markdown, no prose.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error('Groq failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseQuizJSON(content);
  } catch (err) {
    console.error('Groq error:', err);
    return null;
  }
}

async function tryGemini(prompt: string): Promise<QuizQuestion[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
          },
        }),
      },
    );
    if (!res.ok) {
      console.error('Gemini failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;
    return parseQuizJSON(content);
  } catch (err) {
    console.error('Gemini error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const callerId = await getCallerId(request);
    if (!callerId) {
      return NextResponse.json(
        { questions: [], source: 'none', error: 'Sign in required.' } as QuizResponse,
        { status: 401 },
      );
    }

    if (!rateLimit(callerId)) {
      return NextResponse.json(
        { questions: [], source: 'none', error: 'Too many requests. Wait a minute.' } as QuizResponse,
        { status: 429 },
      );
    }

    const body = await request.json();
    const topics: string[] = Array.isArray(body.topics) ? body.topics.slice(0, 10) : [];
    const count =
      typeof body.count === 'number' && body.count >= 3 && body.count <= 10 ? body.count : 5;

    if (topics.length === 0) {
      return NextResponse.json({ questions: [], source: 'none' } as QuizResponse, { status: 400 });
    }

    const prompt = buildPrompt(topics, count);

    let questions = await tryGroq(prompt);
    let source: 'groq' | 'gemini' | 'none' = 'groq';

    if (!questions) {
      console.log('Groq failed, falling back to Gemini');
      questions = await tryGemini(prompt);
      source = 'gemini';
    }

    if (!questions) {
      return NextResponse.json(
        { questions: [], source: 'none' } as QuizResponse,
        { status: 503 },
      );
    }

    return NextResponse.json({ questions, source } as QuizResponse);
  } catch (err) {
    console.error('Quiz route error:', err);
    return NextResponse.json(
      { questions: [], source: 'none' } as QuizResponse,
      { status: 500 },
    );
  }
}