import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { driveLiveBus } from '@/lib/drive/live-bus';
import { DriveLiveEvent } from '@/lib/drive/drive-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = auth.userId;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connected ping
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`));

        // Subscribe to live bus
        const unsubscribe = driveLiveBus.subscribe(userId, (event: DriveLiveEvent) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            unsubscribe();
          }
        });

        // Keep-alive heartbeat every 20s
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
          } catch {
            clearInterval(heartbeat);
            unsubscribe();
          }
        }, 20000);

        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
