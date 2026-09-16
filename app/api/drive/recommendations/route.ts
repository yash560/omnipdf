import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { getMongoDb } from '@/lib/db/mongodb';
import { DriveItem, RecommendationContext, RecommendationResponse } from '@/lib/drive/drive-types';
import {
  generateForYouFeed,
  generateSuggestedActions,
  generateRelatedItems,
} from '@/lib/drive/recommendation-engine';
import { generateSmartDossiers } from '@/lib/drive/dossier-generator';

export async function GET(req: NextRequest) {
  const startTime = performance.now();
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to access Drive recommendations.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeFolderId = searchParams.get('folderId') || null;
    const contextFileId = searchParams.get('fileId') || null;
    const isVaultUnlocked = searchParams.get('vaultUnlocked') === 'true';
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    const db = await getMongoDb();
    const itemsCol = db.collection('filecraft_drive_items');

    // Fetch all active items for the user
    const query: any = {
      $or: [
        { userId: auth.userId },
        { ownerEmail: auth.email.toLowerCase() },
        { 'sharedWith.userId': auth.userId },
        { 'sharedWith.email': auth.email.toLowerCase() },
      ],
      isTrash: false,
    };

    const rawDocs = await itemsCol.find(query).toArray();
    const allItems: DriveItem[] = rawDocs.map(({ _id, ...it }: any) => it as DriveItem);

    const context: RecommendationContext = {
      activeFolderId,
      selectedItemId: contextFileId,
      currentHour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isVaultUnlocked,
    };

    // 1. Generate "Suggested For You" feed
    const forYou = generateForYouFeed(allItems, context, limit);

    // 2. Generate "Contextual Actions & Quick Fixes"
    const suggestedActions = generateSuggestedActions(allItems, context, 5);

    // 3. Generate Smart Dossiers
    const dossiers = generateSmartDossiers(allItems, context);

    // 4. Generate "Related Documents" if specific file context requested
    let related: any[] | undefined = undefined;
    if (contextFileId) {
      const targetItem = allItems.find((it) => it.id === contextFileId);
      if (targetItem) {
        related = generateRelatedItems(targetItem, allItems, context, 5);
      }
    }

    const duration = performance.now() - startTime;

    const response: RecommendationResponse = {
      success: true,
      forYou,
      suggestedActions,
      dossiers,
      related,
      stats: {
        generatedAt: Date.now(),
        totalItemsEvaluated: allItems.length,
        topCategory: forYou.length > 0 ? (forYou[0].item.aiCategory || forYou[0].item.category) : 'General',
        contextMode: activeFolderId ? 'folder_context' : contextFileId ? 'file_context' : 'workspace_hero',
        executionTimeMs: parseFloat(duration.toFixed(2)),
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/drive/recommendations] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate recommendations' }, { status: 500 });
  }
}
