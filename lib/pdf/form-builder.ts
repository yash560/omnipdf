import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type FormFieldType = 'text' | 'multiline' | 'checkbox' | 'dropdown' | 'radio';

export interface FormFieldDefinition {
  id: string;
  name: string;
  type: FormFieldType;
  pageIndex: number;
  x: number; // in PDF points
  y: number; // in PDF points
  width: number;
  height: number;
  defaultValue?: string | boolean;
  options?: string[]; // For dropdown & radio
  placeholder?: string;
  required?: boolean;
}

/**
 * Generate native interactive Adobe AcroForms on PDF document
 */
export async function buildAcroFormPdf(
  originalPdfBytes: ArrayBuffer | Uint8Array,
  fields: FormFieldDefinition[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const fieldDef of fields) {
    if (fieldDef.pageIndex < 0 || fieldDef.pageIndex >= pages.length) continue;
    const page = pages[fieldDef.pageIndex];
    const { height: pageH } = page.getSize();

    // Standard coordinate mapping (top-left Y to bottom-left PDF Y)
    const pdfX = fieldDef.x;
    const pdfY = pageH - fieldDef.y - fieldDef.height;

    switch (fieldDef.type) {
      case 'text':
      case 'multiline': {
        const textField = form.createTextField(fieldDef.name);
        if (fieldDef.defaultValue && typeof fieldDef.defaultValue === 'string') {
          textField.setText(fieldDef.defaultValue);
        }
        if (fieldDef.type === 'multiline') {
          textField.enableMultiline();
        }
        textField.addToPage(page, {
          x: pdfX,
          y: pdfY,
          width: fieldDef.width,
          height: fieldDef.height,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.4, 0.8),
          backgroundColor: rgb(0.96, 0.98, 1.0),
          font,
        });
        break;
      }

      case 'checkbox': {
        const checkBox = form.createCheckBox(fieldDef.name);
        if (fieldDef.defaultValue === true) {
          checkBox.check();
        }
        checkBox.addToPage(page, {
          x: pdfX,
          y: pdfY,
          width: fieldDef.width,
          height: fieldDef.height,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.4, 0.8),
          backgroundColor: rgb(0.96, 0.98, 1.0),
        });
        break;
      }

      case 'dropdown': {
        const dropdown = form.createDropdown(fieldDef.name);
        if (fieldDef.options && fieldDef.options.length > 0) {
          dropdown.addOptions(fieldDef.options);
          if (fieldDef.defaultValue && typeof fieldDef.defaultValue === 'string') {
            dropdown.select(fieldDef.defaultValue);
          } else {
            dropdown.select(fieldDef.options[0]);
          }
        }
        dropdown.addToPage(page, {
          x: pdfX,
          y: pdfY,
          width: fieldDef.width,
          height: fieldDef.height,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.4, 0.8),
          backgroundColor: rgb(0.96, 0.98, 1.0),
          font,
        });
        break;
      }

      case 'radio': {
        const radioGroup = form.createRadioGroup(fieldDef.name);
        const optName = fieldDef.options?.[0] || 'Option 1';
        radioGroup.addOptionToPage(optName, page, {
          x: pdfX,
          y: pdfY,
          width: fieldDef.width,
          height: fieldDef.height,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.4, 0.8),
          backgroundColor: rgb(0.96, 0.98, 1.0),
        });
        if (fieldDef.defaultValue === optName) {
          radioGroup.select(optName);
        }
        break;
      }
    }
  }

  return await pdfDoc.save();
}
