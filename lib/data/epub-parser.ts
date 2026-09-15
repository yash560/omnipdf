import JSZip from 'jszip';

export interface EpubChapter {
  id: string;
  title: string;
  htmlContent: string;
  textContent: string;
}

export interface ParsedEpub {
  title: string;
  author: string;
  coverDataUrl?: string;
  chapters: EpubChapter[];
  fullMarkdown: string;
}

export async function parseEpub(file: File): Promise<ParsedEpub> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let title = file.name.replace(/\.epub$/i, '');
  let author = 'Unknown Author';
  let chapters: EpubChapter[] = [];
  let fullMarkdown = '';

  // Look for HTML / XHTML files in the epub archive
  const htmlFiles: { name: string; content: string }[] = [];

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (!zipEntry.dir && (relativePath.endsWith('.html') || relativePath.endsWith('.xhtml') || relativePath.endsWith('.htm'))) {
      const text = await zipEntry.async('text');
      htmlFiles.push({ name: relativePath, content: text });
    }
  }

  // Parse chapters
  const parser = new DOMParser();
  chapters = htmlFiles.map((f, idx) => {
    const doc = parser.parseFromString(f.content, 'text/html');
    const docTitle = doc.querySelector('h1, h2, title')?.textContent?.trim() || `Chapter ${idx + 1}`;
    const bodyText = doc.body?.textContent?.trim() || '';
    const bodyHtml = doc.body?.innerHTML || '';

    return {
      id: `chapter-${idx + 1}`,
      title: docTitle,
      htmlContent: bodyHtml,
      textContent: bodyText,
    };
  });

  fullMarkdown = chapters.map((c) => `# ${c.title}\n\n${c.textContent}`).join('\n\n---\n\n');

  return {
    title,
    author,
    chapters,
    fullMarkdown,
  };
}

/**
 * Create an EPUB package from Markdown string
 */
export async function createEpubFromMarkdown(title: string, author: string, markdown: string): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/chapter1.xhtml
  const paragraphs = markdown.split('\n\n').map((p) => `<p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n');
  const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${title}</title></head>
<body>
  <h1>${title}</h1>
  <p><em>By ${author}</em></p>
  <hr/>
  ${paragraphs}
</body>
</html>`;
  zip.file('OEBPS/chapter1.xhtml', xhtml);

  // 4. OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chap1"/>
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  // 5. OEBPS/toc.ncx
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:12345"/></head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>${title}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncx);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}
