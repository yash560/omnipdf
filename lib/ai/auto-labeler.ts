import { callGeminiWithRotation } from './gemini-client';
import { DriveItem } from '../drive/drive-types';

export interface FileLabelMetadata {
  fileName: string;
  relativePath?: string;
  category?: string;
  mimeType?: string;
  size?: number;
  textSample?: string;
}

export interface AutoLabelResult {
  tags: string[];
  aiSummary: string;
  aiCategory: string;
  semanticKeywords: string[];
  confidence: number;
}

// Standard taxonomy of categories
export const AI_CATEGORIES = [
  'Identity & KYC',
  'Employment & Career',
  'Finance & Tax',
  'Banking & Cards',
  'Vehicle & Transport',
  'Insurance & Policies',
  'Property & Real Estate',
  'Bills & Invoices',
  'Medical & Health',
  'Education & Certifications',
  'Legal & Contracts',
  'Code & Software',
  'Media & Design',
  'Personal & Family',
  'General Documents',
] as const;

export type AiCategory = typeof AI_CATEGORIES[number];

/**
 * Intelligent AI File Auto-Labeler
 * Uses Gemini 2.5 Flash to inspect document name, folder hierarchy, and context
 * with an instant offline heuristic fallback.
 */
export async function autoLabelFile(meta: FileLabelMetadata): Promise<AutoLabelResult> {
  // 1. First, attempt Gemini 2.5 Flash for deep semantic labeling
  try {
    const prompt = `Analyze this document/file and generate rich, clean metadata for an intelligent cloud drive file system.
File Name: "${meta.fileName}"
Folder / Relative Path: "${meta.relativePath || 'Root'}"
Category: "${meta.category || 'unknown'}"
MimeType: "${meta.mimeType || 'unknown'}"
File Size: ${meta.size ? `${(meta.size / 1024).toFixed(1)} KB` : 'unknown'}
${meta.textSample ? `Content Excerpt:\n"""${meta.textSample.slice(0, 1500)}"""\n` : ''}

Respond with ONLY valid JSON with no markdown formatting or backticks:
{
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "aiSummary": "One crisp, informative sentence describing what this exact document or file is.",
  "aiCategory": "One of: Identity & KYC | Employment & Career | Finance & Tax | Banking & Cards | Vehicle & Transport | Insurance & Policies | Property & Real Estate | Bills & Invoices | Medical & Health | Education & Certifications | Legal & Contracts | Code & Software | Media & Design | Personal & Family | General Documents",
  "semanticKeywords": ["synonym1", "synonym2", "related term 3", "natural search query 4", "alternative name 5", "concept 6"]
}

Guidelines for Tags & Keywords:
- Extract person names if present (e.g. "Yash Jain", "Yogesh Jain")
- Extract document types (e.g. "Aadhaar Card", "Salary Slip", "RC Book", "Tax Invoice", "Offer Letter", "Cancelled Cheque", "Passport Photo")
- Extract organizations/brands (e.g. "SBI", "ICICI", "Whydonate", "Honda Amaze", "Pulsar 150", "TVS Star City", "Digital Convergence Technologies")
- Extract dates or years if referenced in filename/path (e.g. "2023", "2024", "July 2025")
- Include 4 to 8 high-relevance title-cased tags.
- Provide 6 to 12 lowercase semantic search synonyms for effortless natural language discovery.`;

    const rawResponse = await callGeminiWithRotation({
      prompt,
      systemInstruction: 'You are an expert file archivist and knowledge management AI. Output strictly valid JSON without any markdown formatting or explanations.',
      temperature: 0.1,
      maxOutputTokens: 1024,
    });

    // Clean JSON markdown fences if model returned them
    const cleanJson = rawResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed && Array.isArray(parsed.tags) && parsed.aiSummary) {
      const normalizedTags: string[] = Array.from(
        new Set<string>(
          (parsed.tags || [])
            .map((t: any) => String(t).trim())
            .filter((t: string) => t.length >= 2 && t.length <= 40)
        )
      );

      const normalizedKeywords: string[] = Array.from(
        new Set<string>(
          (parsed.semanticKeywords || [])
            .map((k: any) => String(k).toLowerCase().trim())
            .filter((k: string) => k.length >= 2 && k.length <= 50)
        )
      );

      return {
        tags: normalizedTags.length > 0 ? normalizedTags : getHeuristicLabels(meta).tags,
        aiSummary: parsed.aiSummary.trim(),
        aiCategory: parsed.aiCategory || getHeuristicLabels(meta).aiCategory,
        semanticKeywords: normalizedKeywords,
        confidence: 0.95,
      };
    }
  } catch (err) {
    console.warn(`[AutoLabeler] Gemini labeling fallback to heuristic for "${meta.fileName}":`, (err as any).message);
  }

  // 2. High-Precision Heuristic Rule Engine (Zero-fail fallback)
  return getHeuristicLabels(meta);
}

/**
 * High-Precision Heuristic Labeler
 * Analyzes file extensions, names, and folder hierarchies
 */
export function getHeuristicLabels(meta: FileLabelMetadata): AutoLabelResult {
  const name = meta.fileName.toLowerCase();
  const path = (meta.relativePath || '').toLowerCase();
  const fullContext = `${path} ${name}`;

  const tags = new Set<string>();
  const keywords = new Set<string>();
  let aiCategory: string = 'General Documents';
  let summary = `Document: ${meta.fileName}`;

  // Extract People Names
  if (fullContext.includes('yash') || fullContext.includes('yaash')) {
    tags.add('Yash Jain');
    keywords.add('yash');
    keywords.add('yash jain');
  }
  if (fullContext.includes('yogesh')) {
    tags.add('Yogesh Jain');
    tags.add('Dad');
    keywords.add('yogesh');
    keywords.add('father');
    keywords.add('dad');
  }

  // Extract Years
  const yearMatch = fullContext.match(/\b(201[89]|202[0-9]|2030)\b/g);
  if (yearMatch) {
    yearMatch.forEach((y) => {
      tags.add(y);
      keywords.add(y);
    });
  }

  // Domain Category Detection
  if (
    fullContext.includes('aadhaar') || 
    fullContext.includes('aadhar') || 
    fullContext.includes('pan card') || 
    fullContext.includes('voter') || 
    fullContext.includes('passport') || 
    fullContext.includes('driving licence') || 
    fullContext.includes('license') ||
    fullContext.includes('kyc')
  ) {
    aiCategory = 'Identity & KYC';
    tags.add('Identity');
    tags.add('KYC');
    tags.add('Government ID');

    if (fullContext.includes('aadhaar') || fullContext.includes('aadhar')) {
      tags.add('Aadhaar Card');
      keywords.add('uidai');
      keywords.add('id proof');
      keywords.add('address proof');
      summary = `Official Aadhaar identity document.`;
    } else if (fullContext.includes('pan')) {
      tags.add('PAN Card');
      keywords.add('tax id');
      keywords.add('income tax department');
      keywords.add('pan number');
      summary = `Permanent Account Number (PAN) tax identity card.`;
    } else if (fullContext.includes('voter')) {
      tags.add('Voter ID');
      keywords.add('election card');
      keywords.add('epic');
      summary = `Election Commission voter identity card.`;
    } else if (fullContext.includes('passport')) {
      tags.add('Passport Photo');
      keywords.add('photo');
      keywords.add('portrait');
      summary = `Official passport size photograph.`;
    } else if (fullContext.includes('driving') || fullContext.includes('license')) {
      tags.add('Driving Licence');
      keywords.add('dl');
      keywords.add('rto');
      keywords.add('driver license');
      summary = `Official Driving Licence issued by RTO.`;
    }
  } else if (
    fullContext.includes('salary') || 
    fullContext.includes('payslip') || 
    fullContext.includes('offer letter') || 
    fullContext.includes('relieving') || 
    fullContext.includes('experience') || 
    fullContext.includes('resume') || 
    fullContext.includes('joining') ||
    fullContext.includes('recommendation') ||
    fullContext.includes('whydonate') ||
    fullContext.includes('psymate') ||
    fullContext.includes('hyperbeans') ||
    fullContext.includes('repsoft') ||
    fullContext.includes('outworks') ||
    fullContext.includes('molog') ||
    fullContext.includes('dct')
  ) {
    aiCategory = 'Employment & Career';
    tags.add('Career');
    tags.add('Employment');

    if (fullContext.includes('whydonate')) tags.add('Whydonate');
    if (fullContext.includes('psymate')) tags.add('Psymate');
    if (fullContext.includes('hyperbeans')) tags.add('Hyperbeans');
    if (fullContext.includes('repsoft')) tags.add('Repsoft');
    if (fullContext.includes('outworks')) tags.add('Outworks');
    if (fullContext.includes('molog')) tags.add('MoLog');
    if (fullContext.includes('dct') || fullContext.includes('digital convergence')) tags.add('Digital Convergence Technologies');

    if (fullContext.includes('salary') || fullContext.includes('payslip')) {
      tags.add('Salary Slip');
      tags.add('Payroll');
      keywords.add('payslip');
      keywords.add('compensation');
      keywords.add('earnings');
      keywords.add('w2');
      keywords.add('income proof');
      summary = `Official monthly salary payslip.`;
    } else if (fullContext.includes('offer')) {
      tags.add('Offer Letter');
      keywords.add('job offer');
      keywords.add('employment letter');
      summary = `Official employment offer letter.`;
    } else if (fullContext.includes('relieving') || fullContext.includes('experience')) {
      tags.add('Relieving Letter');
      tags.add('Experience Letter');
      keywords.add('service certificate');
      keywords.add('work experience');
      summary = `Experience and relieving certification letter.`;
    } else if (fullContext.includes('resume')) {
      tags.add('Resume');
      keywords.add('cv');
      keywords.add('curriculum vitae');
      summary = `Professional career resume and background profile.`;
    }
  } else if (
    fullContext.includes('amaze') || 
    fullContext.includes('pulsar') || 
    fullContext.includes('activa') || 
    fullContext.includes('star city') || 
    fullContext.includes('vehicle') || 
    fullContext.includes('rc') || 
    fullContext.includes('puc') || 
    fullContext.includes('registration')
  ) {
    aiCategory = 'Vehicle & Transport';
    tags.add('Vehicle');
    tags.add('Automobile');
    tags.add('Transport');

    if (fullContext.includes('amaze')) tags.add('Honda Amaze');
    if (fullContext.includes('pulsar')) tags.add('Bajaj Pulsar 150');
    if (fullContext.includes('activa')) tags.add('Honda Activa');
    if (fullContext.includes('star city') || fullContext.includes('tvs')) tags.add('TVS Star City');

    if (fullContext.includes('rc') || fullContext.includes('registration')) {
      tags.add('RC Registration');
      keywords.add('certificate of registration');
      keywords.add('rc book');
      keywords.add('vehicle smart card');
      summary = `Vehicle Certificate of Registration (RC).`;
    } else if (fullContext.includes('puc')) {
      tags.add('PUC Certificate');
      keywords.add('pollution certificate');
      keywords.add('emission test');
      summary = `Pollution Under Control (PUC) vehicle certificate.`;
    } else if (fullContext.includes('invoice') || fullContext.includes('bill')) {
      tags.add('Vehicle Invoice');
      keywords.add('car purchase bill');
      summary = `Automobile purchase tax invoice and receipt.`;
    }
  } else if (
    fullContext.includes('insurance') || 
    fullContext.includes('policy') || 
    fullContext.includes('policy schedule')
  ) {
    aiCategory = 'Insurance & Policies';
    tags.add('Insurance');
    tags.add('Policy');
    keywords.add('coverage');
    keywords.add('premium');
    keywords.add('policy schedule');
    keywords.add('claim document');
    summary = `Official insurance policy schedule and coverage documentation.`;
  } else if (
    fullContext.includes('bank') || 
    fullContext.includes('sbi') || 
    fullContext.includes('icici') || 
    fullContext.includes('cheque') || 
    fullContext.includes('passbook') || 
    fullContext.includes('debit card') || 
    fullContext.includes('credit card')
  ) {
    aiCategory = 'Banking & Cards';
    tags.add('Banking');
    tags.add('Finance');

    if (fullContext.includes('sbi')) tags.add('State Bank of India');
    if (fullContext.includes('icici')) tags.add('ICICI Bank');

    if (fullContext.includes('cheque')) {
      tags.add('Cancelled Cheque');
      keywords.add('bank account proof');
      keywords.add('micr');
      keywords.add('ifsc');
      summary = `Bank cheque leaf / account verification document.`;
    } else if (fullContext.includes('passbook')) {
      tags.add('Passbook');
      keywords.add('account statement');
      summary = `Bank passbook record of account details.`;
    } else if (fullContext.includes('card')) {
      tags.add('Debit Card');
      keywords.add('atm card');
      keywords.add('visa');
      keywords.add('mastercard');
      summary = `Bank card documentation.`;
    }
  } else if (
    fullContext.includes('property') || 
    fullContext.includes('registry') || 
    fullContext.includes('electricity') || 
    fullContext.includes('tax') || 
    fullContext.includes('municipal')
  ) {
    aiCategory = 'Property & Real Estate';
    tags.add('Property');
    tags.add('Real Estate');
    keywords.add('title deed');
    keywords.add('municipal tax');
    keywords.add('land registry');
    summary = `Property documentation and municipal records.`;
  } else if (
    fullContext.includes('invoice') || 
    fullContext.includes('bill') || 
    fullContext.includes('receipt')
  ) {
    aiCategory = 'Bills & Invoices';
    tags.add('Invoice');
    tags.add('Receipt');
    tags.add('Finance');
    keywords.add('tax invoice');
    keywords.add('payment proof');
    keywords.add('expense');
    summary = `Financial purchase receipt and tax invoice.`;
  }

  // Format tags
  const defaultTags = Array.from(tags).slice(0, 8);
  if (defaultTags.length === 0) {
    defaultTags.push('Document');
    defaultTags.push(aiCategory);
  }

  return {
    tags: defaultTags,
    aiSummary: summary,
    aiCategory,
    semanticKeywords: Array.from(keywords),
    confidence: 0.8,
  };
}

/**
 * Batch auto-labeling helper with concurrency control
 */
export async function batchAutoLabel(
  items: FileLabelMetadata[],
  onProgress?: (completed: number, total: number) => void
): Promise<AutoLabelResult[]> {
  const results: AutoLabelResult[] = [];
  const CONCURRENCY = 4;
  let completed = 0;

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (meta) => {
        const res = await autoLabelFile(meta);
        completed++;
        if (onProgress) onProgress(completed, items.length);
        return res;
      })
    );
    results.push(...chunkResults);
  }

  return results;
}
