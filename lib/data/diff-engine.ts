/**
 * Visual Line-by-Line & Character Diff Engine
 */

export interface DiffLine {
  type: 'added' | 'deleted' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffResult {
  lines: DiffLine[];
  additions: number;
  deletions: number;
  unchanged: number;
}

export function computeDiff(
  oldText: string,
  newText: string,
  ignoreWhitespace = false
): DiffResult {
  let oldLines = oldText.split(/\r?\n/);
  let newLines = newText.split(/\r?\n/);

  if (ignoreWhitespace) {
    oldLines = oldLines.map((l) => l.trim());
    newLines = newLines.map((l) => l.trim());
  }

  const diffLines: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        diffLines.push({
          type: 'unchanged',
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
          content: oldLines[oldIdx],
        });
        oldIdx++;
        newIdx++;
        unchanged++;
      } else {
        // Lookahead to check if added or deleted
        const nextMatchInNew = newLines.indexOf(oldLines[oldIdx], newIdx);
        const nextMatchInOld = oldLines.indexOf(newLines[newIdx], oldIdx);

        if (nextMatchInNew !== -1 && (nextMatchInOld === -1 || nextMatchInNew <= nextMatchInOld)) {
          // Line added in new
          diffLines.push({
            type: 'added',
            newLineNumber: newLineNum++,
            content: newLines[newIdx],
          });
          newIdx++;
          additions++;
        } else {
          // Line deleted from old
          diffLines.push({
            type: 'deleted',
            oldLineNumber: oldLineNum++,
            content: oldLines[oldIdx],
          });
          oldIdx++;
          deletions++;
        }
      }
    } else if (oldIdx < oldLines.length) {
      diffLines.push({
        type: 'deleted',
        oldLineNumber: oldLineNum++,
        content: oldLines[oldIdx],
      });
      oldIdx++;
      deletions++;
    } else if (newIdx < newLines.length) {
      diffLines.push({
        type: 'added',
        newLineNumber: newLineNum++,
        content: newLines[newIdx],
      });
      newIdx++;
      additions++;
    }
  }

  return {
    lines: diffLines,
    additions,
    deletions,
    unchanged,
  };
}
