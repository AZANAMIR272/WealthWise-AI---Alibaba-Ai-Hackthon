import { NextRequest } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { streamChatAI } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { question, history } = await req.json();
    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'Please ask a question' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatAI(userId, question, history || [])) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (e: any) {
          console.error('Chat stream error:', e);
          controller.enqueue(
            encoder.encode('\n__META__' + JSON.stringify({ factors: [], data: {}, error: e.message }))
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('AI error:', error);
    return new Response(
      JSON.stringify({ answer: 'Mujhe abhi thodi mushkil ho rahi hai. Dobara try karein.', factors: [], data: {} }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
