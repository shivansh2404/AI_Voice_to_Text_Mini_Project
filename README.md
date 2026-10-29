# 🎙️ AI Voice to Text — Full-Stack Web Application

A clean, beginner-friendly, and complete full-stack web application that allows users to convert their spoken voice into written text in **Hindi (`hi-IN`)** and **English (`en-IN`)**, edit the text, copy it, download it as a `.txt` file with proper UTF-8 Unicode support, and save it permanently in a **MongoDB** database.

Designed specifically for college students, software engineering project submissions, and viva examinations.

---

## 📑 Table of Contents

1. [Key Features](#-key-features)
2. [Technology Stack](#-technology-stack)
3. [Folder Structure](#-folder-structure)
4. [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
   - [Step 1: Install Node.js](#step-1-install-nodejs)
   - [Step 2: Set Up MongoDB (Local or Cloud Atlas)](#step-2-set-up-mongodb)
   - [Step 3: Install Backend Dependencies](#step-3-install-backend-dependencies)
   - [Step 4: Configure Environment Variables (.env)](#step-4-configure-environment-variables-env)
   - [Step 5: Start the Backend Server](#step-5-start-the-backend-server)
   - [Step 6: Open the Application in Your Browser](#step-6-open-the-application-in-your-browser)
5. [User Guide & Feature Verification](#-user-guide--feature-verification)
6. [API Documentation](#-api-documentation)
7. [Database Schema Design](#-database-schema-design)
8. [College Project Viva Preparation Guide](#-college-project-viva-preparation-guide)

---

## ✨ Key Features

- **White Minimalist UI:** Built using pure HTML5 and clean CSS3 with a white background, dark text, subtle grey borders, and blue buttons.
- **Bi-Lingual Speech Recognition:** Dedicated support for **English (`en-IN`)** and **Hindi (`hi-IN`)** using the browser's native **Web Speech API**.
- **Continuous Speech Recognition:** Allows real-time transcription with interim results and automatic text appending.
- **Editable Workspace:** Users can modify, delete, or add words to the recognized speech before saving.
- **Compulsory MongoDB Storage:** All saved notes are stored persistently in MongoDB via an Express.js REST API with user ownership isolation.
- **Clipboard Integration:** One-click copy for the current text area as well as individual saved notes with permission error handling.
- **Unicode UTF-8 File Download:** One-click `.txt` file export with a safe OS filename and Byte Order Mark (`\uFEFF`) to preserve Hindi Devanagari characters accurately in Windows Notepad and other editors.
- **Real Session Authentication:** Secure registration and login using `bcryptjs` password hashing, `express-session`, and HTTP-only session cookies.
- **Security & Authorization:** Rate limiting on login attempts to prevent brute force, validation on all inputs, and strict user-level note ownership checks.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla ES6) | Clean, fast, zero-build UI; no React or complex tooling required |
| **Backend** | Node.js & Express.js | RESTful API server, routing, session management, static asset delivery |
| **Database** | MongoDB & Mongoose | Persistent NoSQL document storage for Users and Notes |
| **Speech Engine** | Browser Web Speech API (`SpeechRecognition`) | Native real-time voice recognition for English and Hindi |
| **Authentication** | `express-session`, `connect-mongo`, `bcryptjs` | Password hashing and server-side session management with cookies |
| **Security** | `express-rate-limit`, HTTP-only Cookies | Rate limiting and brute-force protection |

---

## 📁 Folder Structure

```text
ai-voice-to-text/
│
├── frontend/
│   ├── index.html        # Landing page (checks active session and redirects)
│   ├── login.html        # Clean login interface with show/hide password
│   ├── register.html     # Registration interface with validation
│   ├── dashboard.html    # Main voice-to-text dashboard & notes manager
│   ├── style.css         # Simple white UI styling (minimal, responsive)
│   ├── auth.js           # Authentication client logic (login/register/session)
│   └── script.js         # Voice recognition, clipboard, download & MongoDB CRUD
│
├── backend/
│   ├── models/
│   │   ├── User.js       # Mongoose User model (name, email, passwordHash)
│   │   └── Note.js       # Mongoose Note model (userId, title, text, language)
│   ├── routes/
│   │   ├── auth.js       # Registration, login, logout, and session check routes
│   │   └── notes.js      # CRUD routes for notes (protected by auth)
│   ├── middleware/
│   │   └── auth.js       # requireAuth session verification middleware
│   ├── server.js         # Main Express application & MongoDB connection
│   ├── .env.example      # Sample configuration file
│   ├── .env              # Active environment variables
│   └── package.json      # Dependencies and execution scripts
│
└── README.md             # Complete documentation and viva guide
```

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Install Node.js
If you do not have Node.js installed on your computer:
1. Visit the official website: [https://nodejs.org](https://nodejs.org)
2. Download the **LTS (Long Term Support)** version for Windows, macOS, or Linux.
3. Run the installer and accept default settings (ensure "Add to PATH" is checked).
4. Verify the installation by opening your terminal or command prompt:
   ```bash
   node -v
   npm -v
   ```

---

### Step 2: Set Up MongoDB

You can use either a **Local MongoDB Database** or a **Free Cloud MongoDB Atlas Database**.

#### Option A: Local MongoDB (Recommended for Offline Dev)
1. Download **MongoDB Community Server**: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install MongoDB as a Service.
3. The local connection string is:
   ```text
   mongodb://127.0.0.1:27017/ai_voice_to_text
   ```

#### Option B: MongoDB Atlas (Free Cloud Database)
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Create a free **M0 Cluster**.
3. Under **Database Access**, create a database user (e.g., `admin` and a strong password).
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Drivers** -> Copy the connection string. It will look like:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_voice_to_text?retryWrites=true&w=majority
   ```

---

### Step 3: Install Backend Dependencies

1. Open your terminal and navigate into the `backend` directory:
   ```bash
   cd ai-voice-to-text/backend
   ```
2. Install all required packages:
   ```bash
   npm install
   ```

---

### Step 4: Configure Environment Variables (`.env`)

Inside `ai-voice-to-text/backend/`, open or create the `.env` file:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ai_voice_to_text
SESSION_SECRET=super_secret_voice_to_text_session_key_2026_xyz
CLIENT_URL=http://localhost:5000
```

*(Note: If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string).*

---

### Step 5: Start the Backend Server

Inside the `backend` directory, run:

```bash
npm start
```

You should see output similar to:
```text
===============================================
  AI Voice to Text Server running successfully!
  Port: 5000
  URL:  http://localhost:5000
  Frontend served from: .../ai-voice-to-text/frontend
===============================================
  Successfully connected to MongoDB database!
```

---

### Step 6: Open the Application in Your Browser

Open **Google Chrome** or **Microsoft Edge** (browsers with full Web Speech API support) and visit:

```text
http://localhost:5000
```

The Express server automatically delivers the frontend from the same port!

---

## 🧪 User Guide & Feature Verification

### 1. Register a New Account
1. Click **Create an account** on the login screen.
2. Enter your Name, Email, and a Password (at least 6 characters).
3. Click **Register**. The server hashes the password with `bcrypt`, saves the user in MongoDB, initializes an HTTP-only cookie session, and directs you to your Dashboard.

### 2. Speech Recognition in English & Hindi
1. Select your desired language from the dropdown:
   - `English (India) - en-IN`
   - `Hindi (हिन्दी) - hi-IN`
2. Click **Start Recording**.
3. When prompted by your browser, click **Allow** for microphone access.
4. Speak clearly into your microphone:
   - In English: *"Artificial intelligence is transforming modern technology."*
   - In Hindi: *"नमस्ते, यह एक बहुत ही अच्छा प्रोजेक्ट है।"*
5. Your spoken words will instantly appear in real time inside the textarea!
6. Click **Stop Recording** when finished.
7. You can freely click inside the textarea and manually edit, correct, or add text.

### 3. Save Text to MongoDB
1. With your speech text inside the textarea, click **💾 Save Text**.
2. A clean modal pops up asking for a **Note Title**.
3. Enter a title (e.g., *"My First Hindi Speech Note"*).
4. Click **Save to MongoDB**.
5. Once the database confirms the write, a green notification appears, and your note immediately displays in the **Saved Notes** table below.

### 4. Copy Text Feature
- Click **📋 Copy Text** above the textarea to copy the entire workspace text to your clipboard.
- Or click **Copy** next to any note in the table to copy that saved note's text directly.
- A toast notification will state: *"Text copied successfully to clipboard!"*.

### 5. Download Text as `.txt` File
- Click **📥 Download Text (.txt)**.
- Enter a filename or use the provided default.
- The browser downloads a `.txt` file with proper UTF-8 BOM encoding. Open it in Windows Notepad: Hindi characters will render crisply without garbled symbols.
- You can also click **Download** on any row in the Saved Notes table.

### 6. Edit & Update an Existing Note
1. In the Saved Notes table, click **Edit** on a note.
2. Modify the title or text in the modal.
3. Click **Update in MongoDB**. The note is updated in the database and re-rendered in the table.

### 7. Clear Text Workspace
- Click **🧹 Clear Text**.
- A confirmation prompt ensures you don't accidentally lose unsaved text.
- Clearing the workspace **does not** delete any saved notes from MongoDB.

### 8. Delete a Note from MongoDB
1. In the Saved Notes table, click **Delete**.
2. Confirm the prompt: *"Are you sure you want to permanently delete this note from MongoDB?"*.
3. The server executes `DELETE /api/notes/:id`, verifies user ownership, and permanently removes the record.

### 9. Verify Session Persistence & User Isolation
1. Click **Log Out**.
2. Try visiting `http://localhost:5000/dashboard.html` directly: the server immediately redirects you back to `login.html`.
3. Log back in with your credentials: your saved notes are retrieved intact from MongoDB.
4. Register a second account with a different email: notice that the second user's notes table is completely empty. Users **never** see or modify notes belonging to other accounts!

---

## 📡 API Documentation

All protected routes require an active session cookie (`connect.sid`).

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user | `{ name, email, password, confirmPassword }` | `201 Created` with user info |
| `POST` | `/api/auth/login` | Authenticate user (Rate-limited) | `{ email, password }` | `200 OK` with session cookie |
| `POST` | `/api/auth/logout` | Destroy session | None | `200 OK` + clear cookie |
| `GET` | `/api/auth/me` | Check active session | None | `200 OK` with user details |

### Notes Endpoints (`/api/notes`)

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/notes` | Create a new note in MongoDB | `{ title, text, language }` | `201 Created` with saved note |
| `GET` | `/api/notes` | Get all notes of logged-in user | None | `200 OK` with array of notes |
| `GET` | `/api/notes/:id` | Get single note by ID (ownership verified) | None | `200 OK` with note object |
| `PUT` | `/api/notes/:id` | Update note title/text/language | `{ title, text, language }` | `200 OK` with updated note |
| `DELETE` | `/api/notes/:id` | Delete note permanently | None | `200 OK` |

---

## 🗄️ Database Schema Design

### 1. `users` Collection
```javascript
{
  _id: ObjectId("..."),
  name: "Rahul Sharma",
  email: "rahul@example.com",     // Unique Index
  passwordHash: "$2a$10$e8w...",  // Hashed with bcrypt (10 rounds)
  createdAt: ISODate("2026-10-28T10:00:00.000Z")
}
```

### 2. `notes` Collection
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),        // Foreign key referencing users._id (Indexed)
  title: "Hindi Voice Memo",
  text: "नमस्ते, यह एक टेस्ट नोट है।",
  language: "hi-IN",              // Enum: ['en-IN', 'hi-IN']
  createdAt: ISODate("2026-10-28T10:05:00.000Z"),
  updatedAt: ISODate("2026-10-28T10:05:00.000Z")
}
```

---

## 🎓 College Project Viva Preparation Guide

Here are concise, high-scoring answers to questions typically asked by external examiners and professors during a project viva:

### Q1: What is the architecture of this project?
> **Answer:** This application follows the **Client-Server 3-Tier Architecture**:
> 1. **Presentation Layer (Frontend):** Pure HTML5, CSS3, and JavaScript interacting with browser APIs (Web Speech API and Clipboard API).
> 2. **Application Layer (Backend):** A Node.js and Express.js REST API providing endpoint routing, rate limiting, and business logic.
> 3. **Data Layer (Database):** MongoDB managed through Mongoose Object Data Modeling (ODM) with two collections: `users` and `notes`.

---

### Q2: How does the voice-to-text conversion work under the hood?
> **Answer:** It uses the **W3C Web Speech API** (`window.SpeechRecognition` or `window.webkitSpeechRecognition`).
> - When the user clicks *Start Recording*, the browser streams microphone input to the underlying speech recognition engine.
> - We configure `continuous = true` so recording continues without stopping after every sentence.
> - We set `interimResults = true` so partial transcripts appear in real-time as the user speaks.
> - The language is set via the standard BCP-47 language tag: `en-IN` for Indian English or `hi-IN` for Hindi.

---

### Q3: Why is Hindi Unicode preserved in downloaded text files, and what is UTF-8 BOM?
> **Answer:** Hindi is written in the **Devanagari script**, which uses multi-byte Unicode code points. When creating the downloadable `.txt` file, we generate a JavaScript `Blob` with MIME type `text/plain;charset=utf-8` and prepend the **Byte Order Mark (`\uFEFF`)**. The BOM explicitly informs text readers like Windows Notepad that the document is encoded in UTF-8, preventing character encoding corruption or question marks (`???`).

---

### Q4: How is security handled for passwords and sessions?
> **Answer:**
> 1. **Password Hashing:** Passwords are never stored in plain text. We hash them using `bcryptjs` with 10 salt rounds before saving to MongoDB.
> 2. **Session Cookies:** We use `express-session` with `httpOnly: true`. This prevents client-side JavaScript from accessing session cookies, mitigating Cross-Site Scripting (XSS) session theft.
> 3. **Brute Force Defense:** We implemented `express-rate-limit` on `/api/auth/login` to restrict consecutive failed attempts from an IP address.

---

### Q5: How do you prevent User A from accessing or editing User B's notes?
> **Answer:** Through strict **server-side authorization checks**. In every note route (`GET`, `PUT`, `DELETE`), we query MongoDB using both the Note ID **and** the session User ID:
> ```javascript
> Note.findOne({ _id: noteId, userId: req.session.userId });
> ```
> Even if a user attempts to tamper with the Note ID in an API request, the database will return `404 Not Found` because the `userId` does not match their authenticated session.

---

### Q6: Why did you choose MongoDB instead of MySQL or PostgreSQL for this project?
> **Answer:** MongoDB is a document-oriented NoSQL database that natively stores records as BSON/JSON-like documents. Because note titles, text lengths, and metadata vary, MongoDB allows flexible, schema-driven storage without rigid table schemas. Pairing MongoDB with Mongoose and Node.js allows end-to-end JavaScript development with high read/write performance.

---

### Q7: Why use Vanilla JavaScript instead of frameworks like React or Angular?
> **Answer:** Vanilla JavaScript eliminates complex build pipelines, node module bloat, and transpilation steps. It makes the codebase lightweight, transparent, highly performant, and straightforward to explain line-by-line during an academic viva.

---

## 📜 License
This project is open-source and created for academic and educational purposes.

