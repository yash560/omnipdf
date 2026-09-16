import { StudioSession } from '@/types/session';

/**
 * Server-backed studio session store (replaces the old IndexedDB implementation).
 * Same function names/signatures as before so callers (CanvasStudio, SessionDrawer,
 * DashboardClient, edit/page.tsx) don't need to change how they call this module —
 * only how they handle the fact that list/metadata results no longer carry pdfData.
 *
 * Design: PDF bytes are uploaded once per session id (GridFS, via POST /api/sessions).
 * Every subsequent save for that same id is a metadata-only PATCH (annotations,
 * currentPage, zoom, versions...) so autosave on every edit doesn't re-upload the file.
 */

// Session ids known to already have their PDF bytes stored server-side this page load.
const uploadedIds = new Set<string>();

async function ensureAuthed(): Promise<void> {
  await fetch('/api/auth/guest', { method: 'POST', credentials: 'include' }).catch(() => {});
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(input, { ...init, credentials: 'include' });
  if (res.status === 401) {
    await ensureAuthed();
    res = await fetch(input, { ...init, credentials: 'include' });
  }
  return res;
}

function metaOnly(session: StudioSession) {
  const { pdfData, ...meta } = session;
  return meta;
}

/**
 * Save or update a session. First save for a given id uploads the PDF bytes
 * (multipart); subsequent saves for the same id PATCH metadata only.
 */
export async function saveSessionToDB(session: StudioSession): Promise<void> {
  try {
    const stamped: StudioSession = { ...session, lastModified: Date.now() };

    if (!uploadedIds.has(stamped.id)) {
      if (!stamped.pdfData) {
        console.error('Cannot create session on server without pdfData:', stamped.id);
        return;
      }
      const form = new FormData();
      const bytes =
        stamped.pdfData instanceof Uint8Array ? stamped.pdfData : new Uint8Array(stamped.pdfData);
      form.append('file', new Blob([bytes as BlobPart], { type: 'application/pdf' }), stamped.filename);
      form.append('meta', JSON.stringify(metaOnly(stamped)));

      const res = await apiFetch('/api/sessions', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Session create failed: ${res.status}`);
      uploadedIds.add(stamped.id);
      return;
    }

    const res = await apiFetch(`/api/sessions/${stamped.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaOnly(stamped)),
    });
    if (!res.ok) throw new Error(`Session update failed: ${res.status}`);
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

/**
 * Metadata for all of the current user's sessions, sorted by lastModified desc.
 * Does NOT include pdfData — call getSessionFromDB(id) to load a specific
 * session's bytes when the user actually opens it.
 */
export async function getAllSessionsFromDB(): Promise<StudioSession[]> {
  try {
    const res = await apiFetch('/api/sessions');
    if (!res.ok) return [];
    const { sessions } = (await res.json()) as { sessions: StudioSession[] };
    for (const s of sessions) uploadedIds.add(s.id);
    return sessions;
  } catch (err) {
    console.error('Failed to load sessions:', err);
    return [];
  }
}

/**
 * Retrieve one session's full record, including its PDF bytes.
 */
export async function getSessionFromDB(id: string): Promise<StudioSession | null> {
  try {
    const metaRes = await apiFetch(`/api/sessions/${id}`);
    if (!metaRes.ok) return null;
    const meta = (await metaRes.json()) as StudioSession;

    const fileRes = await apiFetch(`/api/sessions/${id}/file`);
    if (!fileRes.ok) return null;
    const pdfData = await fileRes.arrayBuffer();

    uploadedIds.add(id);
    return { ...meta, pdfData };
  } catch (err) {
    console.error('Failed to get session:', err);
    return null;
  }
}

export async function deleteSessionFromDB(id: string): Promise<void> {
  try {
    const res = await apiFetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Session delete failed: ${res.status}`);
    uploadedIds.delete(id);
  } catch (err) {
    console.error('Failed to delete session:', err);
  }
}

export async function clearAllSessionsFromDB(): Promise<void> {
  try {
    const res = await apiFetch('/api/sessions', { method: 'DELETE' });
    if (!res.ok) throw new Error(`Clear sessions failed: ${res.status}`);
    uploadedIds.clear();
  } catch (err) {
    console.error('Failed to clear sessions:', err);
  }
}

/**
 * Export all workspace metadata and annotation snapshots as a backup file.
 */
export async function exportWorkspaceBackup(): Promise<Blob> {
  const sessions = await getAllSessionsFromDB();
  const exportable = sessions.map((s) => ({
    id: s.id,
    filename: s.filename,
    size: s.size,
    pageCount: s.pageCount,
    annotations: s.annotations,
    currentPage: s.currentPage,
    zoom: s.zoom,
    createdAt: s.createdAt,
    lastModified: s.lastModified,
    versions: s.versions,
  }));

  const json = JSON.stringify(exportable, null, 2);
  return new Blob([json], { type: 'application/json' });
}
