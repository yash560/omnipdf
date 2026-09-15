import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/get-server-user';
import { uploadCloudFile, createCloudFolder } from '@/lib/drive/server-drive';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const parentId = (formData.get('parentId') as string) || null;
    const isDirectoryUpload = formData.get('isDirectory') === 'true';

    // 1. Directory Tree Upload
    if (isDirectoryUpload) {
      const files = formData.getAll('files') as File[];
      const paths = formData.getAll('paths') as string[];

      const folderPathMap = new Map<string, string>();
      folderPathMap.set('', parentId || '');

      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = paths[i] || file.name;
        const parts = relativePath.split('/').filter(Boolean);
        const filename = parts.pop() || file.name;

        let currentParentId = parentId;
        let accumulatedPath = '';

        for (const folderName of parts) {
          accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderName}` : folderName;
          if (!folderPathMap.has(accumulatedPath)) {
            const created = await createCloudFolder(auth.userId, folderName, currentParentId);
            folderPathMap.set(accumulatedPath, created.id);
            currentParentId = created.id;
          } else {
            currentParentId = folderPathMap.get(accumulatedPath) || null;
          }
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadCloudFile(auth.userId, filename, file.type, buffer, currentParentId);
        uploadedCount++;
      }

      return NextResponse.json({
        success: true,
        count: uploadedCount,
        message: `Successfully uploaded ${uploadedCount} items to Cloud Drive`,
      });
    }

    // 2. Standard Single / Multi File Upload
    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedItems = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const item = await uploadCloudFile(auth.userId, file.name, file.type, buffer, parentId);
      uploadedItems.push(item);
    }

    return NextResponse.json({
      success: true,
      items: uploadedItems,
      message: `Uploaded ${uploadedItems.length} file(s) to Cloud Drive`,
    });
  } catch (err: any) {
    console.error('[API /api/drive/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
