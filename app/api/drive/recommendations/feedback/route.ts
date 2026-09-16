import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getMongoDb } from '@/lib/db/mongodb';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recommendationId, itemId, action, stream } = body;

    if (!recommendationId || !action) {
      return NextResponse.json({ error: 'recommendationId and action are required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const feedbackCol = db.collection('filecraft_recommendation_feedback');

    await feedbackCol.insertOne({
      userId: auth.userId,
      userEmail: auth.email,
      recommendationId,
      itemId,
      stream: stream || 'for_you',
      action, // 'click' | 'dismiss' | 'pin' | 'action_taken'
      timestamp: Date.now(),
      userAgent: req.headers.get('user-agent') || '',
    });

    return NextResponse.json({ success: true, recorded: true });
  } catch (err: any) {
    console.error('[API /api/drive/recommendations/feedback] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to record feedback' }, { status: 500 });
  }
}
