export type AIPersonaId = 'general' | 'analyst' | 'vision' | 'legal' | 'dev' | 'writer';

export interface AIPersona {
  id: AIPersonaId;
  name: string;
  tagline: string;
  avatarIcon: string;
  systemPrompt: string;
}

export const AI_PERSONAS: Record<AIPersonaId, AIPersona> = {
  general: {
    id: 'general',
    name: 'Universal Copilot',
    tagline: 'All-around document & file intelligence',
    avatarIcon: 'Sparkles',
    systemPrompt: `You are FileCraft's Universal AI Copilot. You are an expert across all file formats (PDFs, images, spreadsheets, media, archives, code, security). Provide crisp, actionable, structured answers with markdown, tables, and clear bullet points.`,
  },
  analyst: {
    id: 'analyst',
    name: 'Data & Formula Analyst',
    tagline: 'Spreadsheets, statistics, formulas & charts',
    avatarIcon: 'Table',
    systemPrompt: `You are an elite Financial & Data Analyst. You excel at CSVs, Excel XLSX, JSON datasets, formula creation (XLOOKUP, INDEX/MATCH, ARRAYFORMULA, QUERY), statistics, trends, outlier detection, and SQL queries. When writing formulas, always explain the syntax and arguments clearly.`,
  },
  vision: {
    id: 'vision',
    name: 'Vision & Prompt Architect',
    tagline: 'Image analysis, Midjourney prompts & UI design',
    avatarIcon: 'Eye',
    systemPrompt: `You are a world-class Visual Artist, Computer Vision specialist, and Generative AI Prompt Engineer. You analyze image compositions, color palettes (hex codes, WCAG contrast), lighting, and reverse-engineer ultra-detailed Midjourney v6 and DALL-E 3 prompts. You also write engaging social media captions with viral hashtags and accessible SEO alt-text.`,
  },
  legal: {
    id: 'legal',
    name: 'Legal & Contract Auditor',
    tagline: 'Clauses, risk mitigation & executive briefs',
    avatarIcon: 'ShieldAlert',
    systemPrompt: `You are a Senior Legal Counsel & Contract Auditor. You analyze agreements, NDAs, terms, and formal documents. Highlight binding liabilities, indemnification terms, jurisdiction, termination clauses, and risks in plain English with high-visibility alerts.`,
  },
  dev: {
    id: 'dev',
    name: 'Dev & Security Engineer',
    tagline: 'Cryptography, code diffs, regex & Base64',
    avatarIcon: 'Code2',
    systemPrompt: `You are a Principal Security Engineer & Full-Stack Architect. You inspect code diffs, cryptographic hashes (SHA-256, MD5 collision resistance), Base64 encodings, regex patterns, steganography, and API schemas. Provide clean, secure, copy-ready code blocks.`,
  },
  writer: {
    id: 'writer',
    name: 'Executive Brief & Copywriter',
    tagline: 'Bullet briefings, meeting minutes & email drafts',
    avatarIcon: 'FileText',
    systemPrompt: `You are a McKinsey-level Executive Communications Specialist. You turn complex transcripts, meeting notes, and lengthy documents into high-impact bulleted briefings, decision logs, assigned action items with deadlines, and polished professional email drafts.`,
  },
};

export interface ToolActionChip {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  persona: AIPersonaId;
}

export const TOOL_ACTION_CHIPS: Record<string, ToolActionChip[]> = {
  // PDF & Document Tools
  pdf: [
    {
      id: 'pdf-summary',
      label: 'Executive Summary',
      icon: 'Sparkles',
      prompt: 'Provide an executive summary of this document in 3-5 concise bullet points highlighting key decisions, financial metrics, and deadlines.',
      persona: 'writer',
    },
    {
      id: 'pdf-actions',
      label: 'Extract Action Items',
      icon: 'CheckSquare',
      prompt: 'Extract all action items, owners, and stated deadlines from this document in a structured markdown checklist table.',
      persona: 'writer',
    },
    {
      id: 'pdf-legal',
      label: 'Audit Legal Risks',
      icon: 'ShieldAlert',
      prompt: 'Identify any legal obligations, penalties, indemnity clauses, or risks mentioned in this document with plain-English explanations.',
      persona: 'legal',
    },
    {
      id: 'pdf-email',
      label: 'Draft Follow-Up Email',
      icon: 'Mail',
      prompt: 'Draft a professional, ready-to-send email summary of this document suitable for clients or executive stakeholders.',
      persona: 'writer',
    },
  ],

  // Image Studio Tools
  image: [
    {
      id: 'img-reverse-prompt',
      label: 'Reverse Midjourney Prompt',
      icon: 'Wand2',
      prompt: 'Analyze this image and generate an ultra-detailed Midjourney v6 / Stable Diffusion prompt with lighting, camera lens, art style, and aspect ratio parameters.',
      persona: 'vision',
    },
    {
      id: 'img-alt-text',
      label: 'SEO Alt-Text & Caption',
      icon: 'Tag',
      prompt: 'Generate an accessible SEO alt-text description (under 120 chars) plus 3 engaging social media captions (LinkedIn, Instagram, X) with relevant hashtags.',
      persona: 'vision',
    },
    {
      id: 'img-ocr-text',
      label: 'Extract All Text (OCR)',
      icon: 'FileText',
      prompt: 'Extract and accurately transcribe all visible text, logos, labels, numbers, and signs present in this image formatted in clean markdown.',
      persona: 'general',
    },
    {
      id: 'img-palette-critique',
      label: 'Color & Composition Critique',
      icon: 'Palette',
      prompt: 'Break down the color palette (with approximate hex codes), visual hierarchy, Rule of Thirds balance, and emotional mood of this image.',
      persona: 'vision',
    },
  ],

  // Spreadsheets & Data Tools
  data: [
    {
      id: 'data-insights',
      label: 'Key Trends & Insights',
      icon: 'TrendingUp',
      prompt: 'Analyze this dataset and highlight the top 5 key statistical findings, growth trends, top performers, and anomalies.',
      persona: 'analyst',
    },
    {
      id: 'data-formula',
      label: 'Generate Excel Formula',
      icon: 'FunctionSquare',
      prompt: 'Based on the column headers in this data, provide the most useful Excel/Google Sheets formulas (e.g. SUMIFS, XLOOKUP, compound growth) with examples.',
      persona: 'analyst',
    },
    {
      id: 'data-sql',
      label: 'Convert to SQL Table',
      icon: 'Database',
      prompt: 'Generate an optimized PostgreSQL / MySQL `CREATE TABLE` schema with appropriate data types, primary keys, and sample `INSERT INTO` queries from this data.',
      persona: 'dev',
    },
    {
      id: 'data-clean',
      label: 'Data Quality Audit',
      icon: 'CheckCircle2',
      prompt: 'Inspect this dataset for common hygiene issues: missing fields, duplicate rows, whitespace anomalies, date format mismatches, and suggest fixes.',
      persona: 'analyst',
    },
  ],

  // Audio & Video Media Tools
  media: [
    {
      id: 'media-minutes',
      label: 'Meeting Minutes & Decisions',
      icon: 'FileSpreadsheet',
      prompt: 'Summarize the spoken audio/transcript into structured meeting minutes: Attendees/Speakers, Key Decisions Made, and Next Steps with Assignees.',
      persona: 'writer',
    },
    {
      id: 'media-chapters',
      label: 'YouTube Chapters & Timestamps',
      icon: 'Clock',
      prompt: 'Create clean, timestamped chapter markers (00:00 - Introduction, etc.) with catchy titles and a 2-paragraph YouTube/Podcast video description.',
      persona: 'writer',
    },
    {
      id: 'media-subtitles',
      label: 'Fix & Polish Subtitles',
      icon: 'Subtitles',
      prompt: 'Review the subtitle timings and dialogue text, correct grammatical typos, format readable line lengths, and ensure smooth reading cadence.',
      persona: 'writer',
    },
  ],

  // Security & Dev Tools
  security: [
    {
      id: 'sec-hash-audit',
      label: 'Cryptographic Hash Analysis',
      icon: 'Lock',
      prompt: 'Explain the security properties of the calculated hash: collision resistance, preimage resistance, algorithm strength (SHA-256 vs MD5/SHA-1), and verification use cases.',
      persona: 'dev',
    },
    {
      id: 'sec-payload-decode',
      label: 'Decode & Inspect Payload',
      icon: 'Binary',
      prompt: 'Analyze this Base64/encoded payload. If it is JSON/JWT/Data URI, decode and explain its structure, security vulnerabilities, and encoding efficiency.',
      persona: 'dev',
    },
    {
      id: 'sec-stego-explain',
      label: 'Steganography Safety Audit',
      icon: 'EyeOff',
      prompt: 'Explain the LSB (Least Significant Bit) steganography technique used here: bit depth impact, visual distortion thresholds, and best practices for secure hidden payloads.',
      persona: 'dev',
    },
  ],

  // Archives & Splitter Tools
  archive: [
    {
      id: 'arch-inventory',
      label: 'Archive Inventory & Tree',
      icon: 'FolderTree',
      prompt: 'Inspect the list of files in this archive. Generate an ASCII directory tree diagram and categorize files by type, size distribution, and purpose.',
      persona: 'dev',
    },
    {
      id: 'arch-readme',
      label: 'Generate README.md',
      icon: 'FileCode2',
      prompt: 'Generate a professional, GitHub-ready `README.md` document documenting the contents, installation steps, and structure of this archive package.',
      persona: 'writer',
    },
  ],
};

export interface UniversalChatRequest {
  messages: { role: 'user' | 'model' | 'assistant'; content: string }[];
  fileContext?: string;
  imageBase64?: string;
  mimeType?: string;
  toolSlug?: string;
  suite?: string;
  personaId?: AIPersonaId;
  customApiKey?: string;
}

