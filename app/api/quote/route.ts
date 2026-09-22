import { NextResponse } from 'next/server';

type Quote = { text: string; author: string };

const FALLBACK: Record<string, Quote[]> = {
  motivational: [
    { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
    { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
    { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Unknown' },
    { text: "You don't have to be great to start, but you have to start to be great.", author: 'Zig Ziglar' },
    { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
    { text: "Believe you can and you're halfway there.", author: 'Unknown' },
  ],
  success: [
    { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
    { text: 'Work hard in silence, let your success be your noise.', author: 'Frank Ocean' },
    { text: "Don't stop when you're tired. Stop when you're done.", author: 'David Goggins' },
    { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
  ],
  learning: [
    { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
    { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
    { text: 'Study while others are sleeping; work while others are loafing.', author: 'William A. Ward' },
    { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  ],
  perseverance: [
    { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { text: 'Arise, awake, and stop not till the goal is reached.', author: 'Swami Vivekananda' },
    { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  ],
};

type QuoteGardenItem = { quoteText?: string; quoteAuthor?: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'motivational';

  try {
    const res = await fetch(
      `https://quote-garden.onrender.com/api/v3/quotes?genre=${category}&limit=15`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = (await res.json()) as { data?: QuoteGardenItem[] };
      if (data?.data?.length) {
        const quotes: Quote[] = data.data
          .map((q) => ({ text: q.quoteText?.trim() || '', author: q.quoteAuthor?.trim() || 'Unknown' }))
          .filter((q) => q.text.length > 0);
        if (quotes.length > 0) return NextResponse.json({ quotes, source: 'live' });
      }
    }
  } catch (err) { console.error('Quote API failed:', err); }

  const fallback = FALLBACK[category] || FALLBACK.motivational;
  return NextResponse.json({ quotes: fallback, source: 'fallback' });
}