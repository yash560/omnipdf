import JSZip from 'jszip';

export interface DocxConvertedResult {
  markdown: string;
  html: string;
  wordCount: number;
  headingsCount: number;
  tablesCount: number;
}

export async function convertDocxToMarkdown(file: File): Promise<DocxConvertedResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX: missing word/document.xml');
  }

  const xmlText = await docXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  let markdownLines: string[] = [];
  let htmlLines: string[] = [];
  let headingsCount = 0;
  let tablesCount = 0;

  // Process Paragraphs and Tables
  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) {
    return { markdown: '', html: '', wordCount: 0, headingsCount: 0, tablesCount: 0 };
  }

  const children = Array.from(body.childNodes);

  children.forEach((node: any) => {
    if (node.nodeName === 'w:p') {
      // Paragraph
      let pText = '';
      let isBold = false;
      let isItalic = false;
      let isHeading1 = false;
      let isHeading2 = false;
      let isHeading3 = false;
      let isBullet = false;

      // Check paragraph style
      const pPr = node.getElementsByTagName('w:pPr')[0];
      if (pPr) {
        const pStyle = pPr.getElementsByTagName('w:pStyle')[0];
        if (pStyle) {
          const val = pStyle.getAttribute('w:val') || '';
          if (val.includes('Heading1') || val.includes('heading 1')) isHeading1 = true;
          if (val.includes('Heading2') || val.includes('heading 2')) isHeading2 = true;
          if (val.includes('Heading3') || val.includes('heading 3')) isHeading3 = true;
        }
        const numPr = pPr.getElementsByTagName('w:numPr')[0];
        if (numPr) isBullet = true;
      }

      // Check text runs
      const runs = node.getElementsByTagName('w:r');
      Array.from(runs).forEach((r: any) => {
        const rPr = r.getElementsByTagName('w:rPr')[0];
        const b = rPr && rPr.getElementsByTagName('w:b').length > 0;
        const i = rPr && rPr.getElementsByTagName('w:i').length > 0;

        const tNodes = r.getElementsByTagName('w:t');
        let runText = '';
        Array.from(tNodes).forEach((t: any) => {
          runText += t.textContent || '';
        });

        if (runText) {
          if (b) runText = `**${runText}**`;
          if (i) runText = `*${runText}*`;
          pText += runText;
        }
      });

      if (pText.trim()) {
        if (isHeading1) {
          headingsCount++;
          markdownLines.push(`# ${pText}`);
          htmlLines.push(`<h1>${pText}</h1>`);
        } else if (isHeading2) {
          headingsCount++;
          markdownLines.push(`## ${pText}`);
          htmlLines.push(`<h2>${pText}</h2>`);
        } else if (isHeading3) {
          headingsCount++;
          markdownLines.push(`### ${pText}`);
          htmlLines.push(`<h3>${pText}</h3>`);
        } else if (isBullet) {
          markdownLines.push(`- ${pText}`);
          htmlLines.push(`<li>${pText}</li>`);
        } else {
          markdownLines.push(pText);
          htmlLines.push(`<p>${pText}</p>`);
        }
      }
    } else if (node.nodeName === 'w:tbl') {
      // Table
      tablesCount++;
      const rows = node.getElementsByTagName('w:tr');
      const tableRows: string[][] = [];

      Array.from(rows).forEach((rowNode: any) => {
        const cells = rowNode.getElementsByTagName('w:tc');
        const rowCells: string[] = [];
        Array.from(cells).forEach((cellNode: any) => {
          const tNodes = cellNode.getElementsByTagName('w:t');
          let cellText = '';
          Array.from(tNodes).forEach((t: any) => {
            cellText += (t.textContent || '') + ' ';
          });
          rowCells.push(cellText.trim().replace(/\|/g, '\\|'));
        });
        if (rowCells.length > 0) tableRows.push(rowCells);
      });

      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        markdownLines.push(`| ${headerRow.join(' | ')} |`);
        markdownLines.push(`| ${headerRow.map(() => '---').join(' | ')} |`);
        for (let r = 1; r < tableRows.length; r++) {
          markdownLines.push(`| ${tableRows[r].join(' | ')} |`);
        }
        markdownLines.push('');

        htmlLines.push('<table border="1">');
        tableRows.forEach((r, idx) => {
          const tag = idx === 0 ? 'th' : 'td';
          htmlLines.push(`<tr>${r.map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`);
        });
        htmlLines.push('</table>');
      }
    }
  });

  const markdown = markdownLines.join('\n\n');
  const html = htmlLines.join('\n');
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;

  return {
    markdown,
    html,
    wordCount,
    headingsCount,
    tablesCount,
  };
}
