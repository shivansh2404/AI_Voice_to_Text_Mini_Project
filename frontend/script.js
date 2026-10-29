/**
 * AI Voice to Text - Dashboard Client Logic
 * Handles Web Speech API, MongoDB CRUD operations, clipboard copying, and UTF-8 text file downloads.
 */

// Base API URL
const API_BASE = window.location.port === '5000'
  ? ''
  : `http://${window.location.hostname}:5000`;

// Application State
let currentUser = null;
let recognition = null;
let isRecording = false;
let savedNotesList = [];
let editingNoteId = null;

// DOM Elements
const userDisplayName = document.getElementById('userDisplayName');
const logoutBtn = document.getElementById('logoutBtn');
const unsupportedAlert = document.getElementById('unsupportedAlert');
const recordingStatus = document.getElementById('recordingStatus');
const statusText = document.getElementById('statusText');
const languageSelect = document.getElementById('languageSelect');
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const speechTextarea = document.getElementById('speechTextarea');
const textCounters = document.getElementById('textCounters');
const saveTextBtn = document.getElementById('saveTextBtn');
const copyTextBtn = document.getElementById('copyTextBtn');
const downloadTextBtn = document.getElementById('downloadTextBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const refreshNotesBtn = document.getElementById('refreshNotesBtn');
const notesTableBody = document.getElementById('notesTableBody');
const emptyNotesState = document.getElementById('emptyNotesState');
const notesCountBadge = document.getElementById('notesCountBadge');

// Modal Elements
const noteModal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const noteModalForm = document.getElementById('noteModalForm');
const modalNoteId = document.getElementById('modalNoteId');
const modalNoteTitle = document.getElementById('modalNoteTitle');
const modalNoteLanguage = document.getElementById('modalNoteLanguage');
const modalNoteText = document.getElementById('modalNoteText');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');

// Toast Element
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');
let toastTimer = null;

/* --------------------------------------------------------------------------
   Toast Notification Helper
   -------------------------------------------------------------------------- */
function showToast(message, isSuccess = true) {
  if (toastTimer) clearTimeout(toastTimer);

  toastIcon.textContent = isSuccess ? '✅' : '⚠️';
  toastMessage.textContent = message;
  toastNotification.classList.add('show');

  toastTimer = setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 3500);
}

/* --------------------------------------------------------------------------
   Session & Authentication Verification
   -------------------------------------------------------------------------- */
async function verifySession() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      window.location.replace('login.html');
      return;
    }

    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      userDisplayName.textContent = currentUser.name || 'User';
      // Load user's saved notes from MongoDB
      fetchSavedNotes();
    } else {
      window.location.replace('login.html');
    }
  } catch (err) {
    console.error('Session check failed:', err);
    window.location.replace('login.html');
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    window.location.replace('login.html');
  }
}

/* --------------------------------------------------------------------------
   Character & Word Counters
   -------------------------------------------------------------------------- */
function updateTextCounters() {
  const text = speechTextarea.value.trim();
  const charCount = speechTextarea.value.length;
  const wordCount = text === '' ? 0 : text.split(/\s+/).length;
  textCounters.textContent = `Words: ${wordCount} | Characters: ${charCount}`;
}

/* --------------------------------------------------------------------------
   Web Speech API Initialization & Event Handlers
   -------------------------------------------------------------------------- */
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    // Browser does not support Web Speech API
    unsupportedAlert.style.display = 'block';
    startRecordBtn.disabled = true;
    startRecordBtn.title = 'Speech recognition not supported in this browser';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = languageSelect.value;

  // Track text prior to current speech chunk so user edits are preserved
  let sessionBaseText = '';

  recognition.onstart = () => {
    isRecording = true;
    sessionBaseText = speechTextarea.value;
    if (sessionBaseText && !sessionBaseText.endsWith(' ') && !sessionBaseText.endsWith('\n')) {
      sessionBaseText += ' ';
    }

    recordingStatus.classList.add('recording');
    const langLabel = languageSelect.value === 'hi-IN' ? 'Hindi' : 'English';
    statusText.textContent = `Listening in ${langLabel}...`;
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    languageSelect.disabled = true;
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPiece;
      } else {
        interimTranscript += transcriptPiece;
      }
    }

    if (finalTranscript) {
      sessionBaseText += finalTranscript + ' ';
    }

    speechTextarea.value = sessionBaseText + interimTranscript;
    updateTextCounters();
    // Scroll textarea to bottom so user sees incoming text
    speechTextarea.scrollTop = speechTextarea.scrollHeight;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error event:', event.error);
    let errorMessage = 'Speech recognition error occurred.';

    switch (event.error) {
      case 'not-allowed':
      case 'service-not-allowed':
        errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser.';
        break;
      case 'no-speech':
        errorMessage = 'No speech detected. Please check your microphone.';
        break;
      case 'network':
        errorMessage = 'Network error during speech recognition. Check internet connectivity.';
        break;
      case 'audio-capture':
        errorMessage = 'No microphone was found. Please ensure a microphone is connected.';
        break;
      default:
        errorMessage = `Speech recognition error: ${event.error}`;
    }

    showToast(errorMessage, false);
    stopRecording();
  };

  recognition.onend = () => {
    isRecording = false;
    recordingStatus.classList.remove('recording');
    statusText.textContent = 'Ready';
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
    languageSelect.disabled = false;
  };
}

function startRecording() {
  if (!recognition) {
    showToast('Speech recognition is not supported in this browser.', false);
    return;
  }
  if (isRecording) return;

  // Set the selected language (en-IN or hi-IN)
  recognition.lang = languageSelect.value;

  try {
    recognition.start();
  } catch (err) {
    console.error('Failed to start recognition:', err);
    showToast('Could not start speech recognition: ' + err.message, false);
  }
}

function stopRecording() {
  if (recognition && isRecording) {
    recognition.stop();
  }
}

/* --------------------------------------------------------------------------
   Copy Text Feature (Browser Clipboard API)
   -------------------------------------------------------------------------- */
async function copyCurrentText() {
  const text = speechTextarea.value;
  if (!text.trim()) {
    showToast('Nothing to copy. The workspace is empty.', false);
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('Text copied successfully to clipboard!');
    } else {
      // Fallback for environments where navigator.clipboard is unavailable
      speechTextarea.select();
      document.execCommand('copy');
      showToast('Text copied successfully!');
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    // Graceful fallback attempt
    try {
      speechTextarea.select();
      document.execCommand('copy');
      showToast('Text copied successfully!');
    } catch (fallbackErr) {
      showToast('Could not copy text. Please grant clipboard permissions.', false);
    }
  }
}

async function copySpecificText(text) {
  if (!text) {
    showToast('Note is empty.', false);
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('Note text copied to clipboard!');
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      showToast('Note text copied to clipboard!');
    }
  } catch (err) {
    showToast('Failed to copy note text.', false);
  }
}

/* --------------------------------------------------------------------------
   Download Text Feature (.txt file with Hindi Unicode UTF-8 Support)
   -------------------------------------------------------------------------- */
function downloadTextFile(text, preferredFilename) {
  if (!text || !text.trim()) {
    showToast('Cannot download empty text.', false);
    return;
  }

  // 1. Generate safe OS filename
  let filename = preferredFilename ? preferredFilename.trim() : '';
  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    filename = `voice-note-${timestamp}`;
  }

  // Sanitize filename: remove characters not allowed on Windows/Linux/macOS
  filename = filename.replace(/[/\\?%*:|"<>]/g, '_');
  if (!filename.endsWith('.txt')) {
    filename += '.txt';
  }

  // 2. Preserve Hindi characters with UTF-8 BOM (\uFEFF)
  // The BOM prevents Windows Notepad or basic text editors from misinterpreting Devanagari Unicode
  const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });

  // 3. Trigger download via transient anchor element
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  showToast(`Downloaded "${filename}" successfully!`);
}

function downloadCurrentText() {
  const text = speechTextarea.value;
  if (!text.trim()) {
    showToast('Cannot download empty text. Please speak or type some text first.', false);
    return;
  }

  // Prompt user for preferred filename (or provide default)
  const defaultName = `Voice_Note_${new Date().toISOString().slice(0, 10)}`;
  const inputName = prompt('Enter a filename for your download:', defaultName);

  if (inputName !== null) {
    downloadTextFile(text, inputName || defaultName);
  }
}

/* --------------------------------------------------------------------------
   Clear Text Feature
   -------------------------------------------------------------------------- */
function clearCurrentText() {
  const currentText = speechTextarea.value.trim();
  if (!currentText) return;

  const confirmed = confirm('Are you sure you want to clear the workspace text? This will not delete any saved notes in MongoDB.');
  if (confirmed) {
    speechTextarea.value = '';
    updateTextCounters();
    showToast('Workspace cleared.');
  }
}

/* --------------------------------------------------------------------------
   Save & Edit Modal Management
   -------------------------------------------------------------------------- */
function openSaveModal() {
  const currentText = speechTextarea.value.trim();
  if (!currentText) {
    showToast('Cannot save empty note. Please record or type some text first.', false);
    return;
  }

  editingNoteId = null;
  modalTitle.textContent = 'Save Note to MongoDB';
  modalNoteId.value = '';
  modalNoteTitle.value = '';
  modalNoteLanguage.value = languageSelect.value;
  modalNoteText.value = currentText;
  modalSubmitBtn.textContent = 'Save to MongoDB';

  noteModal.classList.add('active');
  modalNoteTitle.focus();
}

function openEditModal(note) {
  editingNoteId = note._id;
  modalTitle.textContent = 'Edit Note (MongoDB)';
  modalNoteId.value = note._id;
  modalNoteTitle.value = note.title;
  modalNoteLanguage.value = note.language || 'en-IN';
  modalNoteText.value = note.text;
  modalSubmitBtn.textContent = 'Update in MongoDB';

  noteModal.classList.add('active');
  modalNoteTitle.focus();
}

function closeModal() {
  noteModal.classList.remove('active');
  editingNoteId = null;
}

/* --------------------------------------------------------------------------
   MongoDB CRUD Operations (Via Express Backend APIs)
   -------------------------------------------------------------------------- */

/**
 * Fetch all notes owned by the current user from MongoDB
 */
async function fetchSavedNotes() {
  try {
    const res = await fetch(`${API_BASE}/api/notes`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) {
        window.location.replace('login.html');
        return;
      }
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success) {
      savedNotesList = data.notes || [];
      renderNotesTable(savedNotesList);
    }
  } catch (err) {
    console.error('Error fetching notes from MongoDB:', err);
    showToast('Failed to load notes from MongoDB.', false);
  }
}

/**
 * Render the notes list in the table
 */
function renderNotesTable(notes) {
  notesTableBody.innerHTML = '';
  notesCountBadge.textContent = `${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}`;

  if (!notes || notes.length === 0) {
    emptyNotesState.style.display = 'block';
    return;
  }

  emptyNotesState.style.display = 'none';

  notes.forEach((note) => {
    const tr = document.createElement('tr');

    // Language display helper
    const isHindi = note.language === 'hi-IN';
    const langBadgeClass = isHindi ? 'hi' : 'en';
    const langLabel = isHindi ? 'Hindi (hi-IN)' : 'English (en-IN)';

    // Date display
    const formattedDate = new Date(note.createdAt).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Truncate text for table snippet
    const snippet = note.text.length > 55 ? note.text.slice(0, 55) + '...' : note.text;

    tr.innerHTML = `
      <td>
        <div class="note-title-cell">${escapeHtml(note.title)}</div>
        <div class="note-snippet">${escapeHtml(snippet)}</div>
      </td>
      <td>
        <span class="lang-badge ${langBadgeClass}">${langLabel}</span>
      </td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">
        ${formattedDate}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-sm action-open-btn" title="Load into workspace">Open</button>
          <button class="btn btn-outline btn-sm action-copy-btn" title="Copy text">Copy</button>
          <button class="btn btn-outline btn-sm action-download-btn" title="Download as .txt">Download</button>
          <button class="btn btn-outline btn-sm action-edit-btn" title="Edit in MongoDB">Edit</button>
          <button class="btn btn-danger btn-sm action-delete-btn" title="Delete from MongoDB">Delete</button>
        </div>
      </td>
    `;

    // Attach event listeners for row action buttons
    tr.querySelector('.action-open-btn').addEventListener('click', () => {
      openNoteInWorkspace(note);
    });

    tr.querySelector('.action-copy-btn').addEventListener('click', () => {
      copySpecificText(note.text);
    });

    tr.querySelector('.action-download-btn').addEventListener('click', () => {
      downloadTextFile(note.text, note.title);
    });

    tr.querySelector('.action-edit-btn').addEventListener('click', () => {
      openEditModal(note);
    });

    tr.querySelector('.action-delete-btn').addEventListener('click', () => {
      deleteNote(note._id, note.title);
    });

    notesTableBody.appendChild(tr);
  });
}

/**
 * Load an existing note directly into the workspace textarea
 */
function openNoteInWorkspace(note) {
  speechTextarea.value = note.text;
  languageSelect.value = note.language || 'en-IN';
  updateTextCounters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`Loaded "${note.title}" into workspace.`);
}

/**
 * Handle Save or Update Note submission to MongoDB
 */
async function handleNoteModalSubmit(e) {
  e.preventDefault();

  const title = modalNoteTitle.value.trim();
  const language = modalNoteLanguage.value;
  const text = modalNoteText.value.trim();

  if (!title) {
    showToast('Please enter a note title.', false);
    return;
  }

  if (!text) {
    showToast('Note content cannot be empty.', false);
    return;
  }

  modalSubmitBtn.disabled = true;
  modalSubmitBtn.textContent = 'Saving to MongoDB...';

  try {
    let url = `${API_BASE}/api/notes`;
    let method = 'POST';

    // If editing existing note, perform PUT request
    if (editingNoteId) {
      url = `${API_BASE}/api/notes/${editingNoteId}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ title, text, language })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      closeModal();
      showToast(data.message || 'Note saved successfully to MongoDB!');
      // Refresh notes list from MongoDB
      await fetchSavedNotes();
    } else {
      showToast(data.message || 'Failed to save note to MongoDB.', false);
    }
  } catch (err) {
    console.error('Error saving note:', err);
    showToast('Failed to save note. Please verify backend and MongoDB are running.', false);
  } finally {
    modalSubmitBtn.disabled = false;
    modalSubmitBtn.textContent = editingNoteId ? 'Update in MongoDB' : 'Save to MongoDB';
  }
}

/**
 * Delete a note permanently from MongoDB
 */
async function deleteNote(noteId, noteTitle) {
  const confirmed = confirm(`Are you sure you want to permanently delete "${noteTitle}" from MongoDB?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Note deleted permanently from MongoDB.');
      await fetchSavedNotes();
    } else {
      showToast(data.message || 'Could not delete note.', false);
    }
  } catch (err) {
    console.error('Error deleting note:', err);
    showToast('Failed to delete note from MongoDB.', false);
  }
}

/**
 * Escape HTML to prevent XSS in table rendering
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------------------------
   Initialization & Event Listeners
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Verify user session
  verifySession();

  // 2. Initialize Web Speech API
  initSpeechRecognition();

  // 3. User Controls
  logoutBtn.addEventListener('click', handleLogout);
  startRecordBtn.addEventListener('click', startRecording);
  stopRecordBtn.addEventListener('click', stopRecording);
  saveTextBtn.addEventListener('click', openSaveModal);
  copyTextBtn.addEventListener('click', copyCurrentText);
  downloadTextBtn.addEventListener('click', downloadCurrentText);
  clearTextBtn.addEventListener('click', clearCurrentText);
  refreshNotesBtn.addEventListener('click', fetchSavedNotes);

  // 4. Textarea live counters
  speechTextarea.addEventListener('input', updateTextCounters);

  // 5. Modal actions
  noteModalForm.addEventListener('submit', handleNoteModalSubmit);
  modalCancelBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);

  // Close modal when clicking on overlay background
  noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) closeModal();
  });

  // 6. Language selector change handler
  languageSelect.addEventListener('change', () => {
    if (recognition) {
      recognition.lang = languageSelect.value;
    }
  });
});

