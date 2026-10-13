/**
 * ============================================================================
 * VERBUM CLASSIC TEXT ATELIER - CORE JAVASCRIPT ENGINE
 * Comprehensive text analysis, target limit monitoring, and facility suite.
 * ============================================================================
 */

(function () {
  'use strict';

  // --- DOM Elements Cache ---
  const el = {
    // Textarea & Workbench
    textarea: document.getElementById('mainTextarea'),
    targetInput: document.getElementById('targetLimitInput'),
    targetProgressBar: document.getElementById('targetProgressBar'),
    targetStatusTag: document.getElementById('targetStatusTag'),
    targetRemainingWords: document.getElementById('targetRemainingWords'),
    targetPercentLabel: document.getElementById('targetPercentLabel'),
    presetChips: document.querySelectorAll('.preset-chip'),

    // Primary Metrics
    metricWords: document.getElementById('metricWords'),
    metricChars: document.getElementById('metricChars'),
    metricCharsNoSpace: document.getElementById('metricCharsNoSpace'),
    metricTargetStatus: document.getElementById('metricTargetStatus'),

    // Secondary Metrics
    metricSentences: document.getElementById('metricSentences'),
    metricParagraphs: document.getElementById('metricParagraphs'),
    metricReadingTime: document.getElementById('metricReadingTime'),
    metricSpeakingTime: document.getElementById('metricSpeakingTime'),
    metricReadingEase: document.getElementById('metricReadingEase'),
    metricAvgWordLen: document.getElementById('metricAvgWordLen'),

    // Action Buttons
    btnCopy: document.getElementById('btnCopy'),
    btnClear: document.getElementById('btnClear'),
    downloadDropdownContainer: document.getElementById('downloadDropdownContainer'),
    btnDownloadDropdownToggle: document.getElementById('btnDownloadDropdownToggle'),
    downloadOptions: document.querySelectorAll('.download-option'),

    // Preset & Sample buttons
    sampleButtons: document.querySelectorAll('.btn-load-sample'),
    quickTransformButtons: document.querySelectorAll('.chip-tool-btn'),

    // Theme & Audio Controls
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),

    // Auto Save Status
    autoSaveStatus: document.getElementById('autoSaveStatus'),

    // Modal
    facilityModal: document.getElementById('facilityModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalContentBox: document.getElementById('modalContentBox'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // --- State Management ---
  const state = {
    targetLimit: 500,
    soundEnabled: false,
    theme: localStorage.getItem('verbum_theme') || 'light',
    lastClearedText: '',
    undoTimeout: null,
    audioCtx: null
  };

  // --- Classic Sound Synthesizer (Web Audio API) ---
  function initAudio() {
    if (!state.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioCtx();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playKeyClickSound() {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!state.audioCtx) return;
      const ctx = state.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playChimeSound() {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!state.audioCtx) return;
      const ctx = state.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio fallback
    }
  }

  // --- Syllable Counter Helper for Readability Analysis ---
  function countSyllables(word) {
    word = word.toLowerCase().trim();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? Math.max(1, syllables.length) : 1;
  }

  // --- Calculate Text Metrics Engine ---
  function analyzeText(text) {
    if (!text || text.trim() === '') {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
        speakingTimeMinutes: 0,
        readingEase: 100,
        gradeLevel: 'Accessible to all',
        avgWordLength: 0
      };
    }

    // Characters
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s+/g, '').length;

    // Words extraction
    const wordsArray = text.match(/\b[\p{L}\p{N}'’-]+\b/gu) || [];
    const words = wordsArray.length;

    // Sentences
    const sentencesArray = text.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
    const sentences = Math.max(1, sentencesArray.length);

    // Paragraphs
    const paragraphsArray = text.split(/\n+/).filter(p => p.trim().length > 0);
    const paragraphs = Math.max(1, paragraphsArray.length);

    // Reading & Speaking Speeds (WPM: Reading 220, Speaking 130)
    const readingTimeMinutes = (words / 220);
    const speakingTimeMinutes = (words / 130);

    // Average Word Length
    let totalCharInWords = 0;
    let totalSyllables = 0;
    wordsArray.forEach(w => {
      totalCharInWords += w.length;
      totalSyllables += countSyllables(w);
    });
    const avgWordLength = words > 0 ? (totalCharInWords / words).toFixed(1) : 0;

    // Flesch Reading Ease Score
    let readingEase = 100;
    let gradeLevel = 'Grade 5 (Very Easy)';
    if (words > 3) {
      const wordsPerSentence = words / sentences;
      const syllablesPerWord = totalSyllables / words;
      readingEase = Math.round(206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord));
      readingEase = Math.max(0, Math.min(100, readingEase));

      if (readingEase >= 90) gradeLevel = '5th Grade (Very Easy)';
      else if (readingEase >= 80) gradeLevel = '6th Grade (Easy)';
      else if (readingEase >= 70) gradeLevel = '7th Grade (Fairly Easy)';
      else if (readingEase >= 60) gradeLevel = '8th-9th Grade (Standard)';
      else if (readingEase >= 50) gradeLevel = '10th-12th Grade (Fairly Difficult)';
      else if (readingEase >= 30) gradeLevel = 'College Level (Difficult)';
      else gradeLevel = 'Academic/Graduate (Very Difficult)';
    }

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes,
      readingEase,
      gradeLevel,
      avgWordLength
    };
  }

  // --- Format Duration helper ---
  function formatMinutes(mins) {
    if (mins <= 0) return '0 sec';
    const totalSeconds = Math.round(mins * 60);
    if (totalSeconds < 60) return `${totalSeconds} sec`;
    const m = Math.floor(mins);
    const s = Math.round((mins - m) * 60);
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }

  // --- Update Dashboard Display ---
  function updateMetricsDisplay() {
    const text = el.textarea.value;
    const stats = analyzeText(text);
    const target = state.targetLimit;

    // 1. Primary Metrics Update
    el.metricWords.textContent = stats.words.toLocaleString();
    el.metricChars.textContent = stats.characters.toLocaleString();
    el.metricCharsNoSpace.textContent = stats.charactersNoSpaces.toLocaleString();

    // 2. Target Limit Calculations & UI
    let percent = target > 0 ? Math.round((stats.words / target) * 100) : 0;
    const remaining = target - stats.words;

    el.targetProgressBar.style.width = Math.min(100, percent) + '%';
    el.targetProgressBar.classList.remove('warning', 'exceeded');
    el.targetStatusTag.classList.remove('status-ok', 'status-warning', 'status-exceeded');

    if (stats.words === 0) {
      el.targetStatusTag.textContent = `Target: ${target} words`;
      el.targetStatusTag.className = 'target-status-tag';
      el.targetRemainingWords.textContent = `${target} words remaining`;
      el.targetPercentLabel.textContent = `0%`;
      el.metricTargetStatus.textContent = `0 / ${target} words`;
    } else if (remaining > 0 && percent < 85) {
      el.targetStatusTag.textContent = `On Track`;
      el.targetStatusTag.classList.add('status-ok');
      el.targetRemainingWords.textContent = `${remaining} words remaining`;
      el.targetPercentLabel.textContent = `${percent}%`;
      el.metricTargetStatus.textContent = `${stats.words} / ${target} words (${remaining} left)`;
    } else if (remaining >= 0 && percent >= 85) {
      el.targetProgressBar.classList.add('warning');
      el.targetStatusTag.textContent = remaining === 0 ? `Target Reached!` : `Approaching Limit`;
      el.targetStatusTag.classList.add('status-warning');
      el.targetRemainingWords.textContent = remaining === 0 ? `Exact Target Hit` : `${remaining} words left`;
      el.targetPercentLabel.textContent = `${percent}%`;
      el.metricTargetStatus.textContent = remaining === 0 ? `Target Reached (${target} words)` : `${stats.words} / ${target} words`;
      if (remaining === 0) playChimeSound();
    } else {
      // Exceeded limit
      el.targetProgressBar.classList.add('exceeded');
      el.targetStatusTag.textContent = `Exceeded Limit`;
      el.targetStatusTag.classList.add('status-exceeded');
      const over = Math.abs(remaining);
      el.targetRemainingWords.textContent = `+${over} words over target`;
      el.targetPercentLabel.textContent = `${percent}%`;
      el.metricTargetStatus.textContent = `Exceeded by ${over} words`;
    }

    // 3. Secondary Metrics Update
    el.metricSentences.textContent = stats.sentences.toLocaleString();
    el.metricParagraphs.textContent = stats.paragraphs.toLocaleString();
    el.metricReadingTime.textContent = formatMinutes(stats.readingTimeMinutes);
    el.metricSpeakingTime.textContent = formatMinutes(stats.speakingTimeMinutes);
    el.metricReadingEase.textContent = `${stats.readingEase} / 100`;
    el.metricAvgWordLen.textContent = `${stats.avgWordLength} chars`;

    // 4. Auto-save to LocalStorage
    try {
      localStorage.setItem('verbum_draft_content', text);
      if (el.autoSaveStatus) {
        el.autoSaveStatus.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Saved locally
        `;
      }
    } catch (e) {
      // Ignore quota error
    }
  }

  // --- Toast Notification System ---
  function showToast(message, type = 'info', actionBtn = null) {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'undo' ? 'toast-undo' : ''}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'undo') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    if (actionBtn) {
      toast.appendChild(actionBtn);
    }

    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, actionBtn ? 6000 : 3500);
  }

  // --- Copy to Clipboard Handler ---
  function handleCopy() {
    const text = el.textarea.value;
    if (!text.trim()) {
      showToast('Textarea is empty. Nothing to copy.', 'info');
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Text successfully copied to clipboard!', 'success');
        triggerCopyButtonFeedback();
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    el.textarea.select();
    try {
      document.execCommand('copy');
      showToast('Text successfully copied to clipboard!', 'success');
      triggerCopyButtonFeedback();
    } catch (err) {
      showToast('Unable to access clipboard automatically.', 'info');
    }
  }

  function triggerCopyButtonFeedback() {
    if (!el.btnCopy) return;
    const originalText = el.btnCopy.innerHTML;
    el.btnCopy.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Copied!
    `;
    setTimeout(() => {
      el.btnCopy.innerHTML = originalText;
    }, 2000);
  }

  // --- Clear Text with Safe Undo ---
  function handleClear() {
    const text = el.textarea.value;
    if (!text.trim()) return;

    state.lastClearedText = text;
    el.textarea.value = '';
    updateMetricsDisplay();

    // Create Undo Button
    const undoBtn = document.createElement('button');
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Undo Clear';
    undoBtn.onclick = function () {
      if (state.lastClearedText) {
        el.textarea.value = state.lastClearedText;
        updateMetricsDisplay();
        showToast('Text restored!', 'success');
        state.lastClearedText = '';
      }
    };

    showToast('Document cleared.', 'undo', undoBtn);
  }

  // --- Download System (TXT, MD, DOC, Print) ---
  function downloadBlob(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function handleDownload(format) {
    const text = el.textarea.value;
    if (!text.trim()) {
      showToast('Please type or paste some text before downloading.', 'info');
      return;
    }

    const stats = analyzeText(text);
    const dateStr = new Date().toISOString().slice(0, 10);
    const baseFilename = `verbum_document_${dateStr}`;

    if (format === 'txt') {
      downloadBlob(`${baseFilename}.txt`, text, 'text/plain;charset=utf-8');
      showToast('Plain Text file (.txt) downloaded.', 'success');
    } else if (format === 'md') {
      const mdContent = `---
title: Exported Document
date: ${new Date().toLocaleDateString()}
words: ${stats.words}
characters: ${stats.characters}
generator: Verbum Classic Text Atelier
---

${text}
`;
      downloadBlob(`${baseFilename}.md`, mdContent, 'text/markdown;charset=utf-8');
      showToast('Markdown file (.md) downloaded.', 'success');
    } else if (format === 'doc') {
      // Create Word-compatible HTML format with classic serif styling
      const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Verbum Export Document</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #111827; }
    h1 { font-family: 'Georgia', serif; font-size: 20pt; color: #0f172a; border-bottom: 2px solid #b8860b; padding-bottom: 8px; }
    .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 10pt; }
    .stats-table th, .stats-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    .stats-table th { background: #f8fafc; font-weight: bold; }
    .content { white-space: pre-wrap; margin-top: 20px; font-size: 12pt; }
  </style>
</head>
<body>
  <h1>Verbum Classic Text Atelier &mdash; Manuscript</h1>
  <table class="stats-table">
    <tr>
      <th>Words</th>
      <th>Characters</th>
      <th>Sentences</th>
      <th>Est. Reading Time</th>
      <th>Export Date</th>
    </tr>
    <tr>
      <td>${stats.words}</td>
      <td>${stats.characters}</td>
      <td>${stats.sentences}</td>
      <td>${formatMinutes(stats.readingTimeMinutes)}</td>
      <td>${new Date().toLocaleString()}</td>
    </tr>
  </table>
  <div class="content">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
      downloadBlob(`${baseFilename}.doc`, docHtml, 'application/msword;charset=utf-8');
      showToast('Word Document (.doc) downloaded.', 'success');
    } else if (format === 'print') {
      window.print();
    }

    if (el.downloadDropdownContainer) {
      el.downloadDropdownContainer.classList.remove('open');
    }
  }

  // --- Sample Texts Loader ---
  const samples = {
    academic: `The preservation of classical literary integrity demands not only a command of rhetoric, but an acute appreciation of textual cadence and conciseness. Across centuries of scholarly discourse, essays and monographs have adhered to rigorous proportional guidelines. When drafting an academic treatise or peer-reviewed abstract, precise word economy guarantees that complex theses are communicated with clarity rather than obfuscation. Each sentence must deliver deliberate insight, balancing erudition with accessible prose.`,
    editorial: `In the heart of the historic quarter, where cobblestone corridors meet the gentle whisper of autumn winds, stands the venerable atelier. Here, typography is not merely an assembly of mechanical glyphs, but an art form refined over generations. The scent of aged parchment mingles with bespoke fountain pen inks, creating an atmosphere of quiet contemplation. Modern digital tools, when imbued with this reverence for classical craftsmanship, elevate everyday writing into an enduring editorial statement.`,
    speech: `Distinguished colleagues, honored guests, and friends: We gather today at a pivotal intersection of timeless tradition and forward innovation. Progress does not ask us to abandon the wisdom of classical masters; rather, it invites us to sharpen our tools so that our shared ideas may travel further and resonate deeper. Let us speak with purpose, write with precision, and commit our endeavors to enduring excellence.`
  };

  function loadSample(sampleType) {
    if (samples[sampleType]) {
      el.textarea.value = samples[sampleType];
      updateMetricsDisplay();
      showToast(`Loaded ${sampleType.toUpperCase()} sample text.`, 'success');
      playChimeSound();
    }
  }

  // --- Quick Text Transformations Toolbox ---
  function applyTransformation(action) {
    const text = el.textarea.value;
    if (!text.trim()) {
      showToast('Please enter text to transform.', 'info');
      return;
    }

    let result = text;
    switch (action) {
      case 'uppercase':
        result = text.toUpperCase();
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'titlecase':
        // Chicago / AP style simple title case
        const minorWords = /^(a|an|the|and|but|or|for|nor|on|at|to|from|by|in|of|with)$/i;
        result = text.toLowerCase().replace(/\b\w+\b/g, (match, index) => {
          if (index > 0 && minorWords.test(match)) {
            return match.toLowerCase();
          }
          return match.charAt(0).toUpperCase() + match.slice(1);
        });
        break;
      case 'sentencecase':
        result = text.toLowerCase().replace(/(^\s*|\.\s*|\?\s*|\!\s*)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
        break;
      case 'clean-spaces':
        result = text.replace(/[ \t]+/g, ' ').replace(/^\s+|\s+$/gm, '');
        break;
      case 'remove-empty-lines':
        result = text.replace(/^\s*[\r\n]/gm, '');
        break;
      default:
        break;
    }

    el.textarea.value = result;
    updateMetricsDisplay();
    showToast(`Applied '${action}' transformation.`, 'info');
  }

  // --- Service Facilities Data & Modal System ---
  const facilitiesData = {
    privacy: {
      name: 'Client-Side Privacy Vault',
      tagline: '100% Zero-Cloud Local Processing',
      badge: 'Zero-Knowledge',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
      description: 'Your manuscripts and sensitive copy never leave your browser sandbox. Unlike server-hosted tools that transmit text over remote APIs, Verbum Atelier processes tokenization, character mathematics, and document exports strictly inside local memory.',
      specs: [
        'Zero remote server transmission (No HTTP POST / No Database logging)',
        'Full compliance with GDPR, HIPAA, and confidential NDA workflows',
        'Offline capability: Works seamlessly without active internet connection',
        'Instant client memory flushing on tab closure'
      ]
    },
    engine: {
      name: 'Linguistic Analytics Engine',
      tagline: 'Sub-Millisecond Regex AST Tokenizer',
      badge: 'Real-Time Precision',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      description: 'Engineered with high-throughput Unicode-aware tokenizers. Accurately differentiates between hyphenated terms, em-dashes, contractions, punctuation boundaries, and multilingual accented characters without skipping a beat.',
      specs: [
        'Unicode Property Escape (\\p{L}) support for multi-language scripts',
        'Zero-lag keystroke debouncing for manuscripts exceeding 50,000 words',
        'Accurate sentence boundary detection taking honorifics into account',
        'Exact whitespace segregation (tabs, non-breaking spaces, newlines)'
      ]
    },
    limiter: {
      name: 'Target Word Limit Monitor',
      tagline: 'Dynamic Quota & Milestone Regulator',
      badge: 'Academic & Editorial',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
      description: 'Tailored for academic essays, editorial op-eds, social media constraints, and grant proposals. Set your exact word allocation, monitor smooth visual thresholds, and receive real-time warnings before exceeding editorial maximums.',
      specs: [
        'Custom numerical limits with instant 1-click quick-presets (Social, Essay, Book)',
        'Adaptive 3-tier visual gauge (Active, 85% Warning, Exceeded Limit)',
        'Synthesizer chime notification upon milestone completion',
        'Remaining word and over-target calculations in real-time'
      ]
    },
    export: {
      name: 'Multi-Format Document Export',
      tagline: 'Publishing-Ready Digital Archival',
      badge: 'Multi-Format',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
      description: 'Export with one click to Plain Text (.txt), formatted Markdown with YAML frontmatter (.md), or Microsoft Word compatible documents (.doc) complete with editorial metrics tables and classic typography styling.',
      specs: [
        'Instant binary Blob generation via native browser Object URLs',
        'Word-compatible DOC output with pre-rendered statistical headers',
        'Markdown export with embedded timestamp and word metrics frontmatter',
        'Direct Print / Save to PDF formatted stylesheet support'
      ]
    },
    readability: {
      name: 'Readability & Lexical Grading',
      tagline: 'Flesch-Kincaid & Density Calculator',
      badge: 'Editorial Standard',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
      description: 'Employs the standardized Flesch Reading Ease mathematical formula. Evaluates average sentence length and syllable density per word to grade accessibility from 5th-grade reading up to post-graduate academic treatises.',
      specs: [
        'Algorithmic English syllable extraction regex modeling',
        'Real-time 0–100 Flesch Reading Ease calculation',
        'Average character-per-word density metrics',
        'Immediate feedback on text conciseness and cognitive load'
      ]
    },
    typography: {
      name: 'Typographic & Case Transformation',
      tagline: 'Editorial Formatter & Whitespace Purifier',
      badge: 'Utility Suite',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
      description: 'One-click typographic adjustments. Transform passages into Title Case with Chicago/AP style awareness, convert casing, eliminate duplicate whitespace, and strip unwanted blank line breaks effortlessly.',
      specs: [
        'AP/Chicago style Title Case with lowercased minor prepositions & articles',
        'Sentence capitalization normalization',
        'Redundant whitespace compression & leading/trailing cleanup',
        'Safe non-destructive transforms reversible via Undo'
      ]
    },
    cadence: {
      name: 'Speaking & Reading Cadence Pacing',
      tagline: 'Auditory & Visual Speed Profiler',
      badge: 'Keynote & Podcaster',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
      description: 'Calculates the estimated duration required to read silently (220 words per minute average) or deliver aloud at standard presentation cadence (130 words per minute). Indispensable for keynote speakers and broadcasters.',
      specs: [
        'Dual speed benchmark calculation (Silent Reading vs. Spoken Keynote)',
        'Dynamic minutes and seconds resolution',
        'Optimal for YouTube script timing, podcast outlines, and conference presentations',
        'Instant synchronization with target limits'
      ]
    },
    persistence: {
      name: 'Local Session Memory & Recovery',
      tagline: 'Fail-Safe Local Storage Engine',
      badge: 'Zero Work Loss',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
      description: 'Never lose a line of inspired writing. Verbum Atelier automatically synchronizes your current draft to your browser local storage in real-time, restoring your text even after accidental refreshes or unexpected browser closures.',
      specs: [
        'Continuous client-side draft auto-save without cloud latency',
        'One-click Safe Undo buffer when clearing the entire workspace',
        'Zero battery or bandwidth consumption',
        'Seamless restore upon browser restart'
      ]
    }
  };

  function openFacilityModal(facilityKey) {
    const data = facilitiesData[facilityKey];
    if (!data || !el.facilityModal || !el.modalContentBox) return;

    el.modalContentBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
        <div class="facility-icon-frame" style="margin-bottom:0; width:56px; height:56px;">
          ${data.icon}
        </div>
        <div>
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.12em; font-weight:700; color:var(--gold-primary);">${data.badge}</span>
          <h2 style="font-family:var(--font-serif-heading); font-size:1.6rem; color:var(--text-primary); line-height:1.2;">${data.name}</h2>
          <p style="font-size:0.875rem; color:var(--text-muted);">${data.tagline}</p>
        </div>
      </div>
      <p style="font-size:1rem; color:var(--text-secondary); line-height:1.7; margin-bottom:24px;">${data.description}</p>
      
      <h3 style="font-family:var(--font-serif-display); font-size:0.875rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold-primary); margin-bottom:12px;">Technical Architecture & SLAs</h3>
      <ul style="list-style:none; margin-bottom:28px;">
        ${data.specs.map(spec => `
          <li style="display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; font-size:0.9rem; color:var(--text-secondary);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2.5" style="margin-top:3px; flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${spec}</span>
          </li>
        `).join('')}
      </ul>

      <div style="display:flex; justify-content:flex-end; gap:12px;">
        <button class="btn-classic-primary" onclick="document.getElementById('facilityModal').classList.remove('open'); document.getElementById('mainTextarea').focus();">
          Experience In Workbench
        </button>
      </div>
    `;

    el.facilityModal.classList.add('open');
  }

  // --- Theme Toggle Logic ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('verbum_theme', theme);

    if (el.themeToggleBtn) {
      if (theme === 'dark') {
        el.themeToggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
        el.themeToggleBtn.title = "Switch to Classic Parchment Light Mode";
      } else {
        el.themeToggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
        el.themeToggleBtn.title = "Switch to Midnight Obsidian Dark Mode";
      }
    }
  }

  // --- Sound Toggle Logic ---
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      initAudio();
      playChimeSound();
      showToast('Tactile vintage keystroke sound enabled.', 'info');
      if (el.soundToggleBtn) {
        el.soundToggleBtn.style.borderColor = 'var(--gold-primary)';
        el.soundToggleBtn.style.color = 'var(--gold-primary)';
      }
    } else {
      showToast('Keystroke sound muted.', 'info');
      if (el.soundToggleBtn) {
        el.soundToggleBtn.style.borderColor = '';
        el.soundToggleBtn.style.color = '';
      }
    }
  }

  // --- Event Listeners Setup ---
  function initEventListeners() {
    // Textarea input
    el.textarea.addEventListener('input', () => {
      updateMetricsDisplay();
      playKeyClickSound();
    });

    // Target limit input
    el.targetInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      state.targetLimit = val;
      updateMetricsDisplay();

      // Clear active chip states
      el.presetChips.forEach(chip => chip.classList.remove('active'));
    });

    // Target Limit Preset Chips
    el.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const targetVal = parseInt(chip.dataset.target, 10);
        if (!isNaN(targetVal)) {
          el.presetChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          el.targetInput.value = targetVal;
          state.targetLimit = targetVal;
          updateMetricsDisplay();
          showToast(`Target set to ${targetVal} words.`, 'info');
        }
      });
    });

    // Copy & Clear buttons
    if (el.btnCopy) el.btnCopy.addEventListener('click', handleCopy);
    if (el.btnClear) el.btnClear.addEventListener('click', handleClear);

    // Download dropdown toggle
    if (el.btnDownloadDropdownToggle && el.downloadDropdownContainer) {
      el.btnDownloadDropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        el.downloadDropdownContainer.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!el.downloadDropdownContainer.contains(e.target)) {
          el.downloadDropdownContainer.classList.remove('open');
        }
      });
    }

    // Download Options
    el.downloadOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.preventDefault();
        const format = opt.dataset.format;
        handleDownload(format);
      });
    });

    // Sample Loader buttons
    el.sampleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleType = btn.dataset.sample;
        loadSample(sampleType);
      });
    });

    // Quick Transformation chips
    el.quickTransformButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        applyTransformation(action);
      });
    });

    // Theme toggle button
    if (el.themeToggleBtn) {
      el.themeToggleBtn.addEventListener('click', () => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
      });
    }

    // Sound toggle button
    if (el.soundToggleBtn) {
      el.soundToggleBtn.addEventListener('click', toggleSound);
    }

    // Facility Action Links (View specs in modal)
    document.querySelectorAll('.btn-facility-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const facilityKey = btn.dataset.facility;
        openFacilityModal(facilityKey);
      });
    });

    // Modal Close
    if (el.modalCloseBtn && el.facilityModal) {
      el.modalCloseBtn.addEventListener('click', () => {
        el.facilityModal.classList.remove('open');
      });

      el.facilityModal.addEventListener('click', (e) => {
        if (e.target === el.facilityModal) {
          el.facilityModal.classList.remove('open');
        }
      });
    }

    // Guidelines Table "Apply" buttons
    document.querySelectorAll('.btn-apply-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetVal = parseInt(btn.dataset.target, 10);
        if (!isNaN(targetVal)) {
          el.targetInput.value = targetVal;
          state.targetLimit = targetVal;
          el.presetChips.forEach(c => {
            if (parseInt(c.dataset.target, 10) === targetVal) {
              c.classList.add('active');
            } else {
              c.classList.remove('active');
            }
          });
          updateMetricsDisplay();
          el.textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`Target goal updated to ${targetVal} words.`, 'success');
        }
      });
    });

    // Facilities Category Filter Tabs
    const filterTabs = document.querySelectorAll('.facility-filter-tabs .filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filterCategory = tab.dataset.filter;

        const cards = document.querySelectorAll('.facility-card');
        cards.forEach(card => {
          if (filterCategory === 'all' || card.dataset.category === filterCategory) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');

        // Close other items
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+C: Copy
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+Shift+D: Download TXT
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDownload('txt');
      }
    });

    // Restore draft from local storage if available
    const savedDraft = localStorage.getItem('verbum_draft_content');
    if (savedDraft && savedDraft.trim().length > 0) {
      el.textarea.value = savedDraft;
    } else {
      // Default inspiring classic opening sentence
      el.textarea.value = samples.academic;
    }
  }

  // --- Header scroll shadow enhancement ---
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    if (header) {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    initEventListeners();
    updateMetricsDisplay();
  });

  // Expose global for interactive inline attributes if needed
  window.VerbumApp = {
    openFacilityModal,
    handleDownload,
    loadSample
  };
})();
