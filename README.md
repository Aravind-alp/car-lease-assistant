# 🚗 Car Lease & Loan Audit Suite

An enterprise-grade, full-stack AI Document Intelligence platform designed to protect consumers from unfavorable automotive financial contracts. The application automatically determines the agreement structure (Financing to Own vs. Long-Term Leasing), extracts multi-pillar financial ledgers, flags liability risks, and exposes hidden dealer trapdoors using a PostgreSQL persistent relational data cluster and the Gemini 2.5 Flash intelligence engine.

## 🛠️ System Architecture & Tech Stack

- **Frontend Workspace:** React.js (Vite framework), premium minimal UI engineered with embedded vector SVGs, fluid active state parameters, and a split-screen tabbed cockpit design.
- **Backend API Engine:** Asynchronous FastAPI (Python) framework handling non-blocking multi-part binary file data streams.
- **Extraction Core:** Lightweight in-memory document tokenization using `pypdf`.
- **Database Architecture:** High-performance PostgreSQL relational database clustering for transaction caching, archival tracking, and user session persistence.
- **Core Intelligence:** Type-safe, schema-enforced JSON extraction pipelines powered by the Google GenAI SDK (`gemini-2.5-flash`).

---

## ⚡ Key Features & Core Frameworks

### 1. Dual-Track Automated Ingestion
The system instantly assesses raw document string inputs to distinguish between:
* **Car Loan Agreements:** Audits Financed Amount, APR, Finance Charges, Total of Payments, and checks for predatory Rule of 78s interest front-loading or force-placed insurance clauses.
* **Car Lease Agreements:** Audits Gross Capitalized Cost, Adjusted Cap Cost, Residual Values, Money Factors, Excess Mileage Fees ($/mi), and subjective excessive wear-and-tear criteria.

### 2. Strategic Risk Assessment Matrix
Generates an interactive, color-coded SaaS intelligence ledger categorized dynamically into:
* 🟢 **Favorable Conditions (Pros):** Transparent clauses or protections matching standard legal norms.
* 🟡 **Disadvantageous Flags (Cons):** Placeholder values, hidden administrative costs, or dealer-retained security deposit interest.
* 🔴 **Critical Hazard Risks:** Immediate liability triggers, broad repossession rights, or punitive contract-breaking fees.
* 🔵 **Target Negotiable Items:** A localized financial roadmap highlighting precisely which baseline terms to push back on.

### 3. Contextual RAG Chat Terminal
Features a ChatGPT-style deep-dive chat prompt strictly locked to the viewport bottom. It maintains real-time memory loopbacks against the uploaded document's context vectors, allowing users to safely interrogate complex legal frameworks conversationally.

### 4. Relational Persistence Sidebar
A reactive, half-and-half sidebar cockpit that tracks document ingestion history directly out of the PostgreSQL cluster, allowing instant workspace context-switches without wasting extra AI tokens or re-uploading duplicate files.

---

## 💻 Local Workspace Initialization

### Backend Setup
1. Create a Python virtual environment and activate it:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
