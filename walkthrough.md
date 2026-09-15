# Walkthrough: OmniPDF Complete Ecosystem (Auth, AI Studio, Zero-Knowledge Share)

OmniPDF is a full-blown iLovePDF-style document processing suite and interactive canvas studio with **Authentication & Cloud User Accounts**, **Zero-Knowledge Encrypted Sharing with Download Permissions**, and **Gemini Multimodal AI Page Studio with TheWebVale Key Rotation**.

---

## 🚀 1. Complete Feature Map

### 🔑 Authentication & Cloud User Accounts (`/login`, `/register`, `/dashboard`)
- **Full-Stack JWT & Password Security**:
  - Web Crypto HMAC-SHA-256 JWT tokens stored in secure HttpOnly cookies + client context.
  - Salted SHA-256 password hashing.
  - Endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/guest`, `/api/auth/logout`.
- **Pre-Seeded VIP Account**:
  - **Email**: `yash@thewebvale.com` (Yash Jain, Lead Systems Engineer, Pro Plan, 1GB Cloud Storage).
  - 1-Click "Use Yash Jain VIP" button on login modal and page.
- **1-Click Instant Guest Pro Demo Access**:
  - Allows zero-friction evaluation with persistent session tokens.
- **User Profile Dropdown & Navbar Integration**:
  - Initials avatar with Pro Crown badge.
  - Real-time cloud storage quota bar (e.g. `14.5 MB / 1000 MB`).
  - Quick links to Cloud Dashboard, AI Studio, and Saved Signatures.
- **Cloud Workspace Dashboard (`/dashboard`)**:
  - Live inventory of working drafts, active sessions, and encrypted shares.
  - Metric cards: Documents Stored, AI Queries Used (23-key pool), Cloud Storage, and Security Rating (100% AES-256-GCM).

---

### 🛡️ Zero-Knowledge Encrypted Cloud Share (`/share/[id]`)
- **Client-Side AES-256-GCM Encryption**:
  - In-browser Web Crypto API (`crypto.subtle`) with 128-bit integrity tag, 16-byte random salt, and 12-byte IV.
  - **Mode A (Zero-Knowledge URL)**: Key transported in URL fragment (`#key=...`). RFC 3986 guarantees URL fragments are never sent to the server in HTTP requests.
  - **Mode B (Passcode Lock)**: Recipient enters secret PIN; key derived in-browser via **PBKDF2 (100,000 rounds of HMAC-SHA-256)**.
- **Granular Access & Permission Controls**:
  - `Allow PDF Download (ON / OFF)`: Disables file saving, suppresses `Cmd+S`/`Ctrl+S`, blocks right-click saves, and shows read-only mode badge.
  - `Allow Printing (ON / OFF)`: Shields viewer with `@media print` blackout styles.
  - `Burn After Reading (ON / OFF)`: Single-view self-destructing links.
  - `Confidential Watermarking`: Anti-tamper diagonal vector watermarks across all pages.
- **Open Security & Cryptographic Inspector**:
  - Real-time display of IV, Salt, and Plaintext SHA-256 checksums.
  - Runnable independent **TypeScript / Node.js** and **Python 3 `cryptography`** verification scripts for offline mathematical audit.

---

### 🪄 Gemini Multimodal AI Page Studio (`Toolbar -> AI Studio ✨`)
- **Vision Form Auto-Fill**:
  - Captures high-DPI page canvas images.
  - Scans document blanks, underline fields, signature lines, and tables, populating them with structured user context at pixel-perfect coordinates.
- **Natural Language Prompt-to-Edit**:
  - Executes commands like: *"Add a green APPROVED stamp with today's date on top right"*, *"Insert signature and date line at bottom right"*, *"Add executive summary sticky note on top left"*.
- **Smart AI PII Redactor**:
  - 1-click vision detection and permanent blackout redaction of phone numbers, emails, SSNs, credit cards, tax IDs, and physical addresses.
- **TheWebVale 23-Key Rotation Engine (`lib/ai/gemini-key-rotator.ts`)**:
  - High-availability key pool synced with TheWebVale MongoDB `api-keys` collection.
  - Automatic 429 rate-limit failover with 10-minute cooldowns and sub-20ms instant retry.

---

## 🧪 Verification & Route Status
- **Dev Server**: Active on **port 3001** (`http://localhost:3001`).
- **Build Status**: Verified `pnpm build` (32/32 static and dynamic routes compiled with 0 errors).
- **Tested API Endpoints**:
  - `POST /api/auth/login` (Yash Jain VIP -> Code 200 OK + JWT cookie)
  - `POST /api/auth/guest` (Instant Guest Pro -> Code 200 OK)
  - `GET /api/ai/page-edit` (Key Pool Status -> 23/23 Keys Active, 100% Operational)
  - `POST /api/ai/page-edit` (Prompt-to-Edit -> Code 200 OK + Vector Annotations)
