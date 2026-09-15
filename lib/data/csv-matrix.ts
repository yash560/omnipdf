import * as XLSX from 'xlsx';

export interface ParsedTableData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

/**
 * Detect delimiter (comma, tab, semicolon, pipe)
 */
export function detectDelimiter(text: string): string {
  const firstLines = text.split('\n').slice(0, 5).join('\n');
  const counts: Record<string, number> = {
    ',': (firstLines.match(/,/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
    ';': (firstLines.match(/;/g) || []).length,
    '|': (firstLines.match(/\|/g) || []).length,
  };
  let best = ',';
  let max = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = delim;
    }
  }
  return best;
}

/**
 * Parse CSV / TSV / Semicolon text to tabular rows
 */
export function parseCsvText(text: string, delimiter?: string): ParsedTableData {
  const delim = delimiter || detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rowObj[h || `Column_${idx + 1}`] = cells[idx] !== undefined ? cells[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows, totalRows: rows.length };
}

/**
 * Parse JSON array to tabular rows
 */
export function parseJsonText(jsonStr: string): ParsedTableData {
  let data = JSON.parse(jsonStr);
  if (!Array.isArray(data)) {
    if (typeof data === 'object' && data !== null) {
      // Find the first array property
      const arrKey = Object.keys(data).find((k) => Array.isArray(data[k]));
      if (arrKey) {
        data = data[arrKey];
      } else {
        data = [data];
      }
    } else {
      data = [];
    }
  }

  if (data.length === 0) return { headers: [], rows: [], totalRows: 0 };

  const headerSet = new Set<string>();
  data.forEach((item: any) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((k) => headerSet.add(k));
    }
  });

  const headers = Array.from(headerSet);
  return { headers, rows: data, totalRows: data.length };
}

/**
 * Parse Excel (XLSX / XLS) buffer to tabular rows
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ParsedTableData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rows.length === 0) return { headers: [], rows: [], totalRows: 0 };
  const headers = Object.keys(rows[0]);
  return { headers, rows, totalRows: rows.length };
}

/**
 * Export tabular data to CSV string
 */
export function exportToCsv(data: ParsedTableData, delimiter = ','): string {
  const escapeCell = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = data.headers.map(escapeCell).join(delimiter);
  const rowLines = data.rows.map((row) =>
    data.headers.map((h) => escapeCell(row[h])).join(delimiter)
  );

  return [headerLine, ...rowLines].join('\n');
}

/**
 * Export tabular data to Excel (XLSX) Blob
 */
export function exportToExcel(data: ParsedTableData, sheetName = 'Data'): Blob {
  const worksheet = XLSX.utils.json_to_sheet(data.rows, { header: data.headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const outBuf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Export tabular data to JSON string
 */
export function exportToJson(data: ParsedTableData): string {
  return JSON.stringify(data.rows, null, 2);
}
