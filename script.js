/* ============================================
   LINGUASYNC – script.js
   Main logic: searchable selects, translation,
   copy/speak, swap, character count, toast, navbar
============================================ */

// ─── DOM REFS ────────────────────────────────
const fromTextArea   = document.getElementById('fromText');
const toTextArea     = document.getElementById('toText');
const charCountEl    = document.getElementById('charCount');
const translateBtn   = document.getElementById('translateBtn');
const translateIcon  = document.getElementById('translateIcon');
const translateBtnText = document.getElementById('translateBtnText');
const translateStatus  = document.getElementById('translateStatus');

// ─── STATE ───────────────────────────────────
let fromLang = 'en';
let toLang   = 'es';

// ─── SEARCHABLE SELECT CLASS ─────────────────
class SearchableSelect {
  constructor({ triggerId, dropdownId, searchId, optionsId, selectedTextId, defaultCode, onChange }) {
    this.trigger      = document.getElementById(triggerId);
    this.dropdown     = document.getElementById(dropdownId);
    this.search       = document.getElementById(searchId);
    this.optionsList  = document.getElementById(optionsId);
    this.selectedText = document.getElementById(selectedTextId);
    this.value          = defaultCode;  // bare language code e.g. 'en'
    this.onChange       = onChange;
    this.isOpen         = false;
    this._highlightIdx  = 0;  // keyboard navigation index

    this._buildOptions('');
    this._updateLabel(defaultCode);
    this._bindEvents();
  }

  // Build / filter the dropdown list
  _buildOptions(filter) {
    const q = filter.toLowerCase().trim();
    this.optionsList.innerHTML = '';
    let count = 0;

    for (const [fullCode, name] of Object.entries(countries)) {
      const code = fullCode.split('-')[0];
      if (q && !name.toLowerCase().includes(q) && !code.toLowerCase().includes(q)) continue;

      const li = document.createElement('li');
      li.className = 'lang-option' + (code === this.value ? ' selected' : '');
      li.dataset.code = code;
      li.dataset.name = name;
      li.innerHTML = `<span>${name}</span><span class="lang-code-badge">${code.toUpperCase()}</span>`;
      li.addEventListener('click', () => this._select(code, name));
      this.optionsList.appendChild(li);
      count++;
    }

    if (count === 0) {
      this.optionsList.innerHTML = '<div class="no-results"><i class="fas fa-search-minus"></i> No languages found</div>';
    }

    // Reset highlight to first item whenever the list is rebuilt
    this._highlightIdx = 0;
    this._updateHighlight();
  }

  _updateLabel(code) {
    // Find display name for a given bare code
    for (const [fullCode, name] of Object.entries(countries)) {
      if (fullCode.split('-')[0] === code) {
        this.selectedText.textContent = name;
        return;
      }
    }
  }

  _select(code, name) {
    this.value = code;
    this.selectedText.textContent = name;
    this.close();
    this._buildOptions('');
    this.onChange(code);
  }

  open() {
    this.isOpen = true;
    this.dropdown.classList.add('open');
    this.trigger.classList.add('open');
    this.search.value = '';
    this._highlightIdx = 0;
    this._buildOptions('');
    setTimeout(() => this.search.focus(), 60);
  }

  close() {
    this.isOpen = false;
    this.dropdown.classList.remove('open');
    this.trigger.classList.remove('open');
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  setValue(code) {
    this.value = code;
    this._updateLabel(code);
    this._buildOptions('');
  }

  // Move highlight and scroll into view
  _updateHighlight() {
    const options = this.optionsList.querySelectorAll('.lang-option');
    options.forEach((opt, i) => {
      opt.classList.toggle('highlighted', i === this._highlightIdx);
      if (i === this._highlightIdx) {
        opt.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  _bindEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.search.addEventListener('input', () => {
      this._buildOptions(this.search.value);
    });

    // ── Keyboard navigation inside the search input ──
    this.search.addEventListener('keydown', (e) => {
      const options = this.optionsList.querySelectorAll('.lang-option');
      if (!options.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._highlightIdx = Math.min(this._highlightIdx + 1, options.length - 1);
        this._updateHighlight();

      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._highlightIdx = Math.max(this._highlightIdx - 1, 0);
        this._updateHighlight();

      } else if (e.key === 'Enter') {
        e.preventDefault();
        const highlighted = options[this._highlightIdx];
        if (highlighted) {
          this._select(highlighted.dataset.code, highlighted.dataset.name);
        }

      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    this.search.addEventListener('click', (e) => e.stopPropagation());
    this.dropdown.addEventListener('click', (e) => e.stopPropagation());
  }
}

// ─── INIT SELECTS ─────────────────────────────
const fromSelect = new SearchableSelect({
  triggerId:      'fromTrigger',
  dropdownId:     'fromDropdown',
  searchId:       'fromSearch',
  optionsId:      'fromOptions',
  selectedTextId: 'fromSelectedText',
  defaultCode:    'en',
  onChange: (code) => { fromLang = code; }
});

const toSelect = new SearchableSelect({
  triggerId:      'toTrigger',
  dropdownId:     'toDropdown',
  searchId:       'toSearch',
  optionsId:      'toOptions',
  selectedTextId: 'toSelectedText',
  defaultCode:    'es',
  onChange: (code) => { toLang = code; }
});

// Close both dropdowns when clicking anywhere outside
document.addEventListener('click', () => {
  fromSelect.close();
  toSelect.close();
});

// ─── TRANSLATION ─────────────────────────────
translateBtn.addEventListener('click', () => {
  const text = fromTextArea.value.trim();
  if (!text) {
    fromTextArea.focus();
    return;
  }

  // Loading state
  translateIcon.className = 'fas fa-circle-notch fa-spin';
  translateBtnText.textContent = 'Translating…';
  translateBtn.disabled = true;
  translateStatus.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Fetching translation…';
  toTextArea.value = '';

  const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;

  fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
      let result = '';
      data[0].forEach(item => { if (item[0]) result += item[0]; });
      toTextArea.value = result;
      translateStatus.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> Translation complete';
    })
    .catch(() => {
      translateStatus.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#ef4444"></i> Translation failed – check your connection and try again.';
    })
    .finally(() => {
      translateIcon.className = 'fas fa-language';
      translateBtnText.textContent = 'Translate Now';
      translateBtn.disabled = false;
    });
});

// ─── CHARACTER COUNT ──────────────────────────
fromTextArea.addEventListener('input', () => {
  const len = fromTextArea.value.length;
  charCountEl.textContent = len;
  charCountEl.style.color = len > 4500 ? '#ef4444' : '';
  if (!fromTextArea.value) {
    toTextArea.value = '';
    translateStatus.innerHTML = '';
  }
});

// ─── SWAP / EXCHANGE ──────────────────────────
function swapAll() {
  const tmpText = fromTextArea.value;
  const tmpCode = fromLang;

  fromTextArea.value = toTextArea.value;
  toTextArea.value   = tmpText;

  const newFrom = toLang;
  const newTo   = tmpCode;

  fromSelect.setValue(newFrom);
  toSelect.setValue(newTo);
  fromLang = newFrom;
  toLang   = newTo;

  charCountEl.textContent = fromTextArea.value.length;
  translateStatus.innerHTML = '';
}

document.getElementById('exchangeBtn').addEventListener('click', swapAll);
document.getElementById('swapLangsBtn').addEventListener('click', swapAll);

// ─── CLEAR ────────────────────────────────────
document.getElementById('clearBtn').addEventListener('click', () => {
  fromTextArea.value = '';
  toTextArea.value   = '';
  charCountEl.textContent = '0';
  translateStatus.innerHTML = '';
  fromTextArea.focus();
});

// ─── TOAST ───────────────────────────────────
function showToast(msg, isError = false) {
  const toast   = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = toast.querySelector('i');
  toastMsg.textContent = msg;
  toastIcon.className  = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  toastIcon.style.color = isError ? '#ef4444' : '#10b981';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── COPY ─────────────────────────────────────
document.getElementById('fromCopyBtn').addEventListener('click', () => {
  if (!fromTextArea.value) return;
  navigator.clipboard.writeText(fromTextArea.value)
    .then(() => showToast('Source text copied!'))
    .catch(() => showToast('Could not copy text', true));
});

document.getElementById('toCopyBtn').addEventListener('click', () => {
  if (!toTextArea.value) return;
  navigator.clipboard.writeText(toTextArea.value)
    .then(() => showToast('Translation copied!'))
    .catch(() => showToast('Could not copy text', true));
});

// ─── SPEAK ────────────────────────────────────
document.getElementById('fromSpeakBtn').addEventListener('click', () => {
  if (!fromTextArea.value) return;
  const utt = new SpeechSynthesisUtterance(fromTextArea.value);
  utt.lang = fromLang;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
});

document.getElementById('toSpeakBtn').addEventListener('click', () => {
  if (!toTextArea.value) return;
  const utt = new SpeechSynthesisUtterance(toTextArea.value);
  utt.lang = toLang;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
});

// ─── NAVBAR ───────────────────────────────────
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});
