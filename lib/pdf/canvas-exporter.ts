import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Annotation, TextAnnotation } from '@/types/pdf';

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

/**
 * Bake all interactive annotations from the canvas studio onto native PDF pages
 */
export async function exportAnnotatedPdf(
  originalPdfBytes: ArrayBuffer | Uint8Array,
  annotations: Annotation[],
  pageViewports: { [pageIndex: number]: { width: number; height: number } },
  pageRotations?: { [pageIndex: number]: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontHelveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const fontTimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Group annotations by pageIndex
  const annotationsByPage: { [pageIndex: number]: Annotation[] } = {};
  for (const ann of annotations) {
    if (!annotationsByPage[ann.pageIndex]) {
      annotationsByPage[ann.pageIndex] = [];
    }
    annotationsByPage[ann.pageIndex].push(ann);
  }

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];

    // Apply per-page rotation if modified in Studio
    if (pageRotations && pageRotations[pageIdx]) {
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + pageRotations[pageIdx]) % 360));
    }

    const pageAnns = annotationsByPage[pageIdx] || [];
    if (pageAnns.length === 0) continue;

    const { width: pdfWidth, height: pdfHeight } = page.getSize();
    const viewport = pageViewports[pageIdx] || { width: pdfWidth, height: pdfHeight };

    // Scale factors between editor canvas coordinates and PDF coordinates
    const scaleX = pdfWidth / viewport.width;
    const scaleY = pdfHeight / viewport.height;

    for (const ann of pageAnns) {
      // Convert editor top-left origin (Y down) to PDF bottom-left origin (Y up)
      const pdfX = ann.x * scaleX;
      const pdfW = ann.width * scaleX;
      const pdfH = ann.height * scaleY;
      const pdfY = pdfHeight - (ann.y * scaleY) - pdfH;

      if (ann.type === 'text') {
        const textAnn = ann as TextAnnotation;

        // Pick font based on family and bold/italic
        let textFont = fontHelvetica;
        if (textAnn.fontFamily === 'serif') {
          textFont = textAnn.bold && textAnn.italic ? fontTimesBold : textAnn.bold ? fontTimesBold : textAnn.italic ? fontTimesItalic : fontTimesRoman;
        } else if (textAnn.fontFamily === 'mono') {
          textFont = textAnn.bold ? fontCourierBold : fontCourier;
        } else {
          textFont = textAnn.bold && textAnn.italic ? fontHelveticaBoldOblique : textAnn.bold ? fontHelveticaBold : textAnn.italic ? fontHelveticaOblique : fontHelvetica;
        }

        const color = hexToRgb(textAnn.color || '#000000');
        const fontSize = (textAnn.fontSize || 16) * scaleX;
        const hasBg = textAnn.backgroundColor && textAnn.backgroundColor !== 'transparent';
        const hasBorder = textAnn.borderStyle && textAnn.borderStyle !== 'none';
        const paddingX = (hasBg || hasBorder) ? 4 * scaleX : 0;
        const paddingTop = (hasBg || hasBorder) ? 2 * scaleY : 0;

        // Text transformations
        let displayText = textAnn.text || '';
        if (textAnn.textTransform === 'uppercase') displayText = displayText.toUpperCase();
        else if (textAnn.textTransform === 'lowercase') displayText = displayText.toLowerCase();
        else if (textAnn.textTransform === 'capitalize') {
          displayText = displayText.replace(/\b\w/g, (c) => c.toUpperCase());
        }

        const textWidth = textFont.widthOfTextAtSize(displayText, fontSize);
        const boxW = Math.max(pdfW, textWidth + paddingX * 2);
        const boxH = Math.max(pdfH, fontSize + paddingTop * 2 + (hasBg || hasBorder ? 2 : 0));
        const boxY = pdfHeight - (ann.y * scaleY) - boxH;

        // Draw Background Fill Box if present
        if (hasBg) {
          const bgCol = hexToRgb(textAnn.backgroundColor!);
          page.drawRectangle({
            x: pdfX,
            y: boxY,
            width: boxW,
            height: boxH,
            color: rgb(bgCol.r, bgCol.g, bgCol.b),
            opacity: textAnn.opacity ?? 1,
          });
        }

        // Draw Border if configured
        if (hasBorder) {
          const borderCol = hexToRgb(textAnn.borderColor || '#000000');
          page.drawRectangle({
            x: pdfX,
            y: boxY,
            width: boxW,
            height: boxH,
            borderColor: rgb(borderCol.r, borderCol.g, borderCol.b),
            borderWidth: (textAnn.borderWidth || 1) * scaleX,
            opacity: textAnn.opacity ?? 1,
          });
        }

        // Calculate Horizontal Alignment
        let startX = pdfX + paddingX;
        if (textAnn.textAlign === 'center') {
          startX = pdfX + (boxW - textWidth) / 2;
        } else if (textAnn.textAlign === 'right') {
          startX = pdfX + boxW - textWidth - paddingX;
        }

        // Standard Helvetica Postscript ascender metric is 0.718 of font size.
        const baselineY = pdfHeight - (ann.y * scaleY) - paddingTop - (fontSize * 0.718);

        // Draw Text
        page.drawText(displayText, {
          x: startX,
          y: baselineY,
          size: fontSize,
          font: textFont,
          color: rgb(color.r, color.g, color.b),
          opacity: textAnn.opacity ?? 1,
        });

        // Draw Underline if enabled
        if (textAnn.underline) {
          page.drawLine({
            start: { x: startX, y: baselineY - (1.5 * scaleY) },
            end: { x: startX + textWidth, y: baselineY - (1.5 * scaleY) },
            thickness: (textAnn.borderWidth || 1.2) * scaleX,
            color: rgb(color.r, color.g, color.b),
            opacity: textAnn.opacity ?? 1,
          });
        }

        // Draw Strikethrough if enabled
        if (textAnn.strikethrough) {
          const strikeY = baselineY + (fontSize * 0.28);
          page.drawLine({
            start: { x: startX, y: strikeY },
            end: { x: startX + textWidth, y: strikeY },
            thickness: (textAnn.borderWidth || 1.2) * scaleX,
            color: rgb(color.r, color.g, color.b),
            opacity: textAnn.opacity ?? 1,
          });
        }
      } else if (ann.type === 'rectangle') {
        const strokeCol = hexToRgb(ann.strokeColor || '#000000');
        const fillCol = ann.fillColor && ann.fillColor !== 'transparent' ? hexToRgb(ann.fillColor) : null;

        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          borderColor: rgb(strokeCol.r, strokeCol.g, strokeCol.b),
          borderWidth: (ann.strokeWidth || 2) * scaleX,
          color: fillCol ? rgb(fillCol.r, fillCol.g, fillCol.b) : undefined,
          opacity: ann.opacity ?? 1,
        });
      } else if (ann.type === 'circle') {
        const strokeCol = hexToRgb(ann.strokeColor || '#000000');
        const fillCol = ann.fillColor && ann.fillColor !== 'transparent' ? hexToRgb(ann.fillColor) : null;

        page.drawEllipse({
          x: pdfX + pdfW / 2,
          y: pdfY + pdfH / 2,
          xScale: pdfW / 2,
          yScale: pdfH / 2,
          borderColor: rgb(strokeCol.r, strokeCol.g, strokeCol.b),
          borderWidth: (ann.strokeWidth || 2) * scaleX,
          color: fillCol ? rgb(fillCol.r, fillCol.g, fillCol.b) : undefined,
          opacity: ann.opacity ?? 1,
        });
      } else if (ann.type === 'line' || ann.type === 'arrow') {
        const strokeCol = hexToRgb(ann.strokeColor || '#000000');
        const startX = pdfX;
        const startY = pdfY + pdfH;
        const endX = pdfX + pdfW;
        const endY = pdfY;

        page.drawLine({
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          thickness: (ann.strokeWidth || 2) * scaleX,
          color: rgb(strokeCol.r, strokeCol.g, strokeCol.b),
          opacity: ann.opacity ?? 1,
        });
      } else if (ann.type === 'draw' || ann.type === 'highlight') {
        if (ann.points && ann.points.length > 1) {
          const color = hexToRgb(ann.color || (ann.type === 'highlight' ? '#fef08a' : '#000000'));
          const strokeWidth = (ann.strokeWidth || (ann.type === 'highlight' ? 14 : 3)) * scaleX;
          const opacity = ann.type === 'highlight' ? 0.4 : (ann.opacity ?? 1);

          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];

            const p1x = p1.x * scaleX;
            const p1y = pdfHeight - (p1.y * scaleY);
            const p2x = p2.x * scaleX;
            const p2y = pdfHeight - (p2.y * scaleY);

            page.drawLine({
              start: { x: p1x, y: p1y },
              end: { x: p2x, y: p2y },
              thickness: strokeWidth,
              color: rgb(color.r, color.g, color.b),
              opacity,
            });
          }
        }
      } else if (ann.type === 'redact') {
        // Redaction is a 100% solid permanent blackout box
        const color = hexToRgb(ann.fillColor || '#000000');
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: rgb(color.r, color.g, color.b),
          opacity: 1.0,
        });
      } else if (ann.type === 'image' || ann.type === 'signature' || ann.type === 'stamp') {
        if (ann.dataUrl) {
          let embeddedImg: any;
          if (ann.dataUrl.startsWith('data:image/png')) {
            embeddedImg = await pdfDoc.embedPng(ann.dataUrl);
          } else {
            embeddedImg = await pdfDoc.embedJpg(ann.dataUrl);
          }

          page.drawImage(embeddedImg, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            opacity: ann.opacity ?? 1,
            rotate: degrees(ann.rotation || 0),
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}
