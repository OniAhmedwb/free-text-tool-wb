# 📜 Verbum Atelier &mdash; Free Professional Classic Text Studio

A free, sovereign, and privacy-first text tools website engineered with a **classic editorial aesthetic**, real-time linguistic metrics, target word limit tracking, and instant document archival.

---

## ✨ Features & Capabilities

### 1. ✍️ Real-Time Precision Metrics Engine
- **Live Word Count**: High-throughput Unicode-aware tokenization handling contractions, hyphenated compounds, and multilingual character sets.
- **Character Count (With Spaces)**: Instant tracking of all glyphs, whitespace, and formatting carriage returns.
- **Character Count (Without Spaces)**: Accurate count of alphanumeric characters and punctuation marks.
- **Sentences & Paragraphs**: Intelligent boundary detection with period, question mark, exclamation mark, and newline normalization.
- **Reading Time Estimation**: Dynamic pacing calculation based on standard silent reading cadence (220 words/minute).
- **Speaking Time Cadence**: Essential for keynotes, lectures, podcast scripts, and speeches (130 words/minute).
- **Flesch Reading Ease & Grade Level**: Algorithmic scoring of readability and cognitive accessibility from elementary to post-graduate difficulty.
- **Average Word Length**: Lexical density metrics.

### 2. 🎯 Dynamic Target Word Limit Monitor
- Set any custom target limit (e.g. 250, 500, 1,000, 2,500 words).
- **1-Click Presets**: Social (50w), Abstract (150w), Essay (500w), Article (1,000w), Longform (2,500w).
- **Smooth Visual Progress Bar**: Changes from green (on track) to amber (approaching limit) to alert crimson (exceeded limit).
- **Live Counter**: Displays exact remaining words or over-target counts.
- **Audio Chime**: Optional synthesized harmonic tone when target milestone is achieved.

### 3. 📋 Copy, Clear, and Safe Undo
- **Copy to Clipboard**: One-click instant copy with checkmark visual feedback and toast confirmation. Keyboard shortcut: `Ctrl + Shift + C`.
- **Clear Text with Undo**: Instant wipe of the workspace paired with a 6-second emergency "Undo Clear" toast so you never lose inspired thoughts by accident.
- **Continuous Local Storage Draft Sync**: Text is automatically cached locally so you can refresh or restart your browser without losing progress.

### 4. 📥 Multi-Format Document Archival
- **Plain Text (.txt)**: Clean `.txt` export via native browser blob generation. Keyboard shortcut: `Ctrl + Shift + D`.
- **Word Manuscript (.doc)**: Formatted Microsoft Word compatible document with typography styling and analytical metrics header table.
- **Markdown (.md)**: Includes YAML frontmatter with timestamp, word count, character count, and generator tags.
- **Print / PDF**: Direct printer stylesheet integration for exporting formatted PDF transcripts.

### 5. 🏛️ Highlighting 8 Core Service Facilities
1. **Client-Side Privacy Vault**: Zero server transmission; 100% in-browser processing, GDPR & HIPAA safe.
2. **Linguistic Analytics Engine**: Sub-millisecond Unicode AST tokenizer.
3. **Target Word Limit Monitor**: Dynamic milestone and editorial compliance regulator.
4. **Multi-Format Document Archival**: Native blob export into TXT, DOC, MD, and PDF.
5. **Readability & Lexical Grading**: Standardized Flesch Reading Ease formula and syllable heuristics.
6. **Typographic & Case Transformations**: Chicago/AP Title Case, UPPERCASE, lowercase, sentence case, and whitespace compression.
7. **Speaking & Reading Cadence Profiler**: Real-time auditory and visual pacing for broadcasters and public speakers.
8. **Local Session Memory & Safe Undo**: In-browser draft preservation with fail-safe undo buffer.

### 6. 🎨 Classic Editorial Design System
- **Classic Typography**: Google Fonts *Playfair Display*, *Cinzel*, *Plus Jakarta Sans*, and *JetBrains Mono*.
- **Classic Color Palette**: Antique Gold accents (`#b8860b` / `#d4af37`), deep Oxford Navy (`#0f172a`), warm ivory parchment (`#fcfbf7`), and midnight obsidian dark mode (`#0a0e17`).
- **Tactile Keystroke Synthesizer**: Optional Web Audio API typewriter sound effects with instant mute/unmute control.

---

## 🚀 How to Run the Website

Simply double click `index.html` or open it with any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

Alternatively, launch with any local HTTP server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js npx
npx serve .
```
Then navigate to `http://localhost:8000` or open `index.html` directly in your browser.
