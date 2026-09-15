import { ParsedTableData } from './csv-matrix';

export interface CleanOptions {
  trimWhitespace: boolean;
  removeDuplicateRows: boolean;
  dedupeColumn?: string; // specific column or all
  removeEmptyRows: boolean;
  fillNullValue?: string; // replace empty with 'N/A' or '0'
  textTransform?: 'none' | 'trim' | 'lowercase' | 'uppercase' | 'titlecase';
  standardizeDates?: boolean;
}

export interface CleanReport {
  originalRows: number;
  cleanedRows: number;
  duplicatesRemoved: number;
  emptyRowsRemoved: number;
  cellsTrimmed: number;
}

export function cleanTabularData(
  data: ParsedTableData,
  options: CleanOptions
): { cleaned: ParsedTableData; report: CleanReport } {
  let rows = [...data.rows];
  const origCount = rows.length;
  let dupesRemoved = 0;
  let emptyRemoved = 0;
  let cellsModified = 0;

  // 1. Remove empty rows
  if (options.removeEmptyRows) {
    const prev = rows.length;
    rows = rows.filter((row) => {
      const hasContent = data.headers.some((h) => {
        const val = row[h];
        return val !== null && val !== undefined && String(val).trim().length > 0;
      });
      return hasContent;
    });
    emptyRemoved = prev - rows.length;
  }

  // 2. Cell value transformations & trimming
  rows = rows.map((row) => {
    const newRow: Record<string, any> = {};
    data.headers.forEach((h) => {
      let val = row[h];
      if (val === undefined || val === null || val === '') {
        if (options.fillNullValue) {
          val = options.fillNullValue;
          cellsModified++;
        } else {
          val = '';
        }
      } else if (typeof val === 'string') {
        if (options.trimWhitespace) {
          const trimmed = val.trim().replace(/\s+/g, ' ');
          if (trimmed !== val) cellsModified++;
          val = trimmed;
        }
        if (options.textTransform === 'lowercase') val = val.toLowerCase();
        if (options.textTransform === 'uppercase') val = val.toUpperCase();
        if (options.textTransform === 'titlecase') {
          val = val.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
        if (options.standardizeDates) {
          // Check if ISO or slash date
          const dateTest = new Date(val);
          if (!isNaN(dateTest.getTime()) && val.match(/\d{4}|\d{2}\/\d{2}/)) {
            val = dateTest.toISOString().split('T')[0];
          }
        }
      }
      newRow[h] = val;
    });
    return newRow;
  });

  // 3. Deduplicate
  if (options.removeDuplicateRows) {
    const seen = new Set<string>();
    const prev = rows.length;
    rows = rows.filter((row) => {
      const key = options.dedupeColumn && row[options.dedupeColumn]
        ? String(row[options.dedupeColumn]).trim().toLowerCase()
        : JSON.stringify(row);

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    dupesRemoved = prev - rows.length;
  }

  return {
    cleaned: {
      headers: data.headers,
      rows,
      totalRows: rows.length,
    },
    report: {
      originalRows: origCount,
      cleanedRows: rows.length,
      duplicatesRemoved: dupesRemoved,
      emptyRowsRemoved: emptyRemoved,
      cellsTrimmed: cellsModified,
    },
  };
}
