import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_BOOKS,
  INITIAL_BORROWERS,
  INITIAL_LOANS,
  INITIAL_REGIONS,
  INITIAL_REMINDERS,
} from './src/data/mockData';
import { Book, Borrower, Loan, Region, EmailReminder } from './src/types';

// Storage file path for persistence across server restarts
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface LocalDB {
  regions: Region[];
  books: Book[];
  borrowers: Borrower[];
  loans: Loan[];
  reminders: EmailReminder[];
  lastUpdated: string;
}

// Load or initialize DB
function loadDatabase(): LocalDB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading db.json, using defaults:', err);
  }

  const initialDB: LocalDB = {
    regions: INITIAL_REGIONS,
    books: INITIAL_BOOKS,
    borrowers: INITIAL_BORROWERS,
    loans: INITIAL_LOANS,
    reminders: INITIAL_REMINDERS,
    lastUpdated: new Date().toISOString(),
  };
  saveDatabase(initialDB);
  return initialDB;
}

function saveDatabase(db: LocalDB) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Initialize Gemini AI Client lazily/safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  let db = loadDatabase();

  // Helper to re-calculate loan statuses
  function refreshLoanStatuses() {
    const today = new Date().toISOString().split('T')[0];
    db.loans.forEach((loan) => {
      if (loan.status !== 'Returned') {
        if (loan.dueDate < today) {
          loan.status = 'Overdue';
        } else {
          loan.status = 'Active';
        }
      }
    });
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Bahai Library (BLibrary)', timestamp: new Date().toISOString() });
  });

  // Regions
  app.get('/api/regions', (req, res) => {
    res.json(db.regions);
  });

  app.post('/api/regions', (req, res) => {
    const { code, name, location, contactEmail } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required.' });
    }
    const newRegion: Region = {
      id: `reg-${Date.now()}`,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      location: location || '',
      contactEmail: contactEmail || '',
    };
    db.regions.push(newRegion);
    saveDatabase(db);
    res.status(201).json(newRegion);
  });

  // Books
  app.get('/api/books', (req, res) => {
    res.json(db.books);
  });

  app.post('/api/books', (req, res) => {
    const bookData = req.body;
    const region = db.regions.find((r) => r.id === bookData.regionId) || db.regions[0];
    const regionCode = region ? region.code : 'GEN';

    // Auto-generate accession number if not provided
    const nextNum = db.books.filter((b) => b.regionId === bookData.regionId).length + 1001;
    const accessionNumber = bookData.accessionNumber || `BL-${regionCode}-${nextNum}`;

    // Auto-generate barcode if not provided
    const barcode = bookData.barcode || `${regionCode}${Date.now().toString().slice(-8)}`;

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: bookData.title,
      author: bookData.author,
      translator: bookData.translator || '',
      category: bookData.category || 'Sacred Writings',
      regionId: bookData.regionId || region.id,
      accessionNumber,
      barcode,
      isbn: bookData.isbn || '',
      publisher: bookData.publisher || '',
      publishYear: bookData.publishYear ? Number(bookData.publishYear) : undefined,
      language: bookData.language || 'English',
      shelfLocation: bookData.shelfLocation || 'Shelf A-1',
      totalCopies: Number(bookData.totalCopies || 1),
      availableCopies: Number(bookData.totalCopies || 1),
      description: bookData.description || '',
      coverUrl: bookData.coverUrl || '',
      tags: Array.isArray(bookData.tags) ? bookData.tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.books.unshift(newBook);
    saveDatabase(db);
    res.status(201).json(newBook);
  });

  app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const index = db.books.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const updatedBook: Book = {
      ...db.books[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    db.books[index] = updatedBook;
    saveDatabase(db);
    res.json(updatedBook);
  });

  app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    db.books = db.books.filter((b) => b.id !== id);
    saveDatabase(db);
    res.json({ success: true, id });
  });

  // Borrowers
  app.get('/api/borrowers', (req, res) => {
    res.json(db.borrowers);
  });

  app.post('/api/borrowers', (req, res) => {
    const { name, email, phone, regionId, address, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    const memberId = `MEM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newBorrower: Borrower = {
      id: `bor-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      regionId: regionId || db.regions[0].id,
      memberId,
      address: address || '',
      activeLoansCount: 0,
      status: 'Active',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    db.borrowers.unshift(newBorrower);
    saveDatabase(db);
    res.status(201).json(newBorrower);
  });

  app.put('/api/borrowers/:id', (req, res) => {
    const { id } = req.params;
    const index = db.borrowers.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Borrower not found' });
    }
    db.borrowers[index] = { ...db.borrowers[index], ...req.body };
    saveDatabase(db);
    res.json(db.borrowers[index]);
  });

  // Loans (Checkout, Return, Renew)
  app.get('/api/loans', (req, res) => {
    refreshLoanStatuses();
    res.json(db.loans);
  });

  app.post('/api/loans/checkout', (req, res) => {
    const { bookId, borrowerId, loanDays = 14, notes = '' } = req.body;
    const book = db.books.find((b) => b.id === bookId);
    const borrower = db.borrowers.find((br) => br.id === borrowerId);

    if (!book || !borrower) {
      return res.status(400).json({ error: 'Invalid book or borrower ID.' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'No copies available for checkout.' });
    }

    const issueDateObj = new Date();
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + Number(loanDays));

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      bookId,
      borrowerId,
      copyNumber: book.totalCopies - book.availableCopies + 1,
      issueDate: issueDateObj.toISOString().split('T')[0],
      dueDate: dueDateObj.toISOString().split('T')[0],
      status: 'Active',
      notes,
      reminderCount: 0,
    };

    book.availableCopies -= 1;
    borrower.activeLoansCount += 1;

    db.loans.unshift(newLoan);
    saveDatabase(db);
    res.status(201).json(newLoan);
  });

  app.post('/api/loans/return', (req, res) => {
    const { loanId, notes } = req.body;
    const loan = db.loans.find((l) => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    loan.status = 'Returned';
    loan.returnDate = new Date().toISOString().split('T')[0];
    if (notes) loan.notes = (loan.notes ? loan.notes + ' | ' : '') + notes;

    const book = db.books.find((b) => b.id === loan.bookId);
    if (book && book.availableCopies < book.totalCopies) {
      book.availableCopies += 1;
    }

    const borrower = db.borrowers.find((br) => br.id === loan.borrowerId);
    if (borrower && borrower.activeLoansCount > 0) {
      borrower.activeLoansCount -= 1;
    }

    saveDatabase(db);
    res.json({ success: true, loan });
  });

  app.post('/api/loans/renew', (req, res) => {
    const { loanId, extraDays = 14 } = req.body;
    const loan = db.loans.find((l) => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const currentDue = new Date(loan.dueDate);
    currentDue.setDate(currentDue.getDate() + Number(extraDays));
    loan.dueDate = currentDue.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];
    if (loan.dueDate >= today) {
      loan.status = 'Active';
    }

    saveDatabase(db);
    res.json({ success: true, loan });
  });

  // Reminders
  app.get('/api/reminders', (req, res) => {
    res.json(db.reminders);
  });

  app.post('/api/reminders/send', async (req, res) => {
    const { loanId, customSubject, customBody } = req.body;
    refreshLoanStatuses();
    const loan = db.loans.find((l) => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan record not found.' });
    }

    const borrower = db.borrowers.find((b) => b.id === loan.borrowerId);
    const book = db.books.find((b) => b.id === loan.bookId);

    if (!borrower || !book) {
      return res.status(400).json({ error: 'Borrower or book data missing for this loan.' });
    }

    const todayMs = new Date().getTime();
    const dueMs = new Date(loan.dueDate).getTime();
    const daysOverdue = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 3600 * 24)));

    let subject = customSubject;
    let body = customBody;

    if (!subject || !body) {
      subject = `BLibrary Overdue Reminder: ${book.title}`;
      body = `Dear ${borrower.name},\n\nWarmest greetings from the Baha'i Library (BLibrary).\n\nThis is a friendly reminder that "${book.title}" was due on ${loan.dueDate} (${daysOverdue} days overdue).\n\nPlease return or renew this volume at your earliest convenience so that other community members may also benefit from it.\n\nWith warm regards,\nBLibrary Administration`;
    }

    const newReminder: EmailReminder = {
      id: `rem-${Date.now()}`,
      loanId: loan.id,
      borrowerId: borrower.id,
      borrowerEmail: borrower.email,
      borrowerName: borrower.name,
      bookTitle: book.title,
      dueDate: loan.dueDate,
      daysOverdue,
      subject,
      body,
      sentAt: new Date().toISOString(),
      status: 'Sent',
      triggerType: 'Manual Dispatch',
    };

    loan.reminderCount += 1;
    loan.lastReminderSentAt = newReminder.sentAt;

    db.reminders.unshift(newReminder);
    saveDatabase(db);

    res.json({ success: true, reminder: newReminder });
  });

  app.post('/api/reminders/automate-all', async (req, res) => {
    refreshLoanStatuses();
    const overdueLoans = db.loans.filter((l) => l.status === 'Overdue');

    const sentReminders: EmailReminder[] = [];
    const todayMs = new Date().getTime();

    for (const loan of overdueLoans) {
      const borrower = db.borrowers.find((b) => b.id === loan.borrowerId);
      const book = db.books.find((b) => b.id === loan.bookId);
      if (!borrower || !book) continue;

      const dueMs = new Date(loan.dueDate).getTime();
      const daysOverdue = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 3600 * 24)));

      const reminder: EmailReminder = {
        id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        loanId: loan.id,
        borrowerId: borrower.id,
        borrowerEmail: borrower.email,
        borrowerName: borrower.name,
        bookTitle: book.title,
        dueDate: loan.dueDate,
        daysOverdue,
        subject: `[Automated] BLibrary Reminder: Return of ${book.title}`,
        body: `Dear ${borrower.name},\n\nWe hope this message finds you in health and happiness. Our library record indicates that the title "${book.title}" was due on ${loan.dueDate}.\n\nTo ensure our collection remains accessible to all community members, please return or extend your loan.\n\nThank you for your loving co-operation.\n\nBLibrary Management`,
        sentAt: new Date().toISOString(),
        status: 'Sent',
        triggerType: 'Automated Cron',
      };

      loan.reminderCount += 1;
      loan.lastReminderSentAt = reminder.sentAt;
      db.reminders.unshift(reminder);
      sentReminders.push(reminder);
    }

    saveDatabase(db);
    res.json({
      success: true,
      processedCount: overdueLoans.length,
      sentReminders,
    });
  });

  // Gemini AI endpoints
  app.post('/api/gemini/generate-reminder', async (req, res) => {
    try {
      const { borrowerName, bookTitle, dueDate, daysOverdue, tone = 'gentle & encouraging' } = req.body;
      const ai = getGeminiClient();

      const prompt = `Write a polite, warm, and respectful Baha'i Library (BLibrary) email reminder for a book borrower.
Borrower Name: ${borrowerName || 'Valued Borrower'}
Book Title: ${bookTitle || 'Library Book'}
Due Date: ${dueDate || 'recently'}
Days Overdue: ${daysOverdue || 0}
Tone: ${tone}

Requirements:
- Include a clear Subject line starting with "Subject: "
- Use an encouraging, dignified, and loving Baha'i tone
- Mention that returning books promptly helps all community members access sacred and educational literature
- Keep it concise (150-200 words)`;

      const result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const text = result.text || '';
      let subject = `BLibrary Overdue Notice: ${bookTitle}`;
      let body = text;

      if (text.includes('Subject:')) {
        const parts = text.split('\n');
        const subjectLine = parts.find((p) => p.startsWith('Subject:'));
        if (subjectLine) {
          subject = subjectLine.replace('Subject:', '').trim();
          body = parts.filter((p) => !p.startsWith('Subject:')).join('\n').trim();
        }
      }

      res.json({ subject, body });
    } catch (err: any) {
      console.error('Error generating Gemini reminder:', err);
      res.status(500).json({ error: err.message || 'Failed to generate reminder copy via Gemini AI.' });
    }
  });

  app.post('/api/gemini/catalog-assist', async (req, res) => {
    try {
      const { title, author } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required for AI auto-cataloging.' });
      }

      const ai = getGeminiClient();
      const prompt = `Provide Baha'i library metadata for the book titled "${title}"${author ? ` by ${author}` : ''}.
Return a strict JSON object with:
- "description": A concise 2-3 sentence overview of the book's contents, significance, or historical context.
- "category": Choose one exact match from ["Sacred Writings", "Baha'i History", "Introductory & Principles", "Administration & Covenant", "Youth & Children", "Devotional & Prayers", "Deepening & Study", "Biographies & Memoirs"]
- "language": Suggested primary language (e.g. "English", "Persian", "Spanish", "French", "Swahili", "Arabic")
- "tags": Array of 3-5 keywords or subjects (e.g. ["Sacred Text", "Laws", "Spiritual"])`;

      const result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(result.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in catalog-assist Gemini:', err);
      res.status(500).json({ error: err.message || 'Failed to auto-catalog book via Gemini AI.' });
    }
  });

  // Cloud Sync Endpoint for Offline Cross-Device state reconciliation
  app.post('/api/sync', (req, res) => {
    const { clientState } = req.body;
    if (clientState) {
      // Basic merge strategy: if client has newer or additional items, append them
      if (Array.isArray(clientState.books)) {
        clientState.books.forEach((cb: Book) => {
          const idx = db.books.findIndex((b) => b.id === cb.id);
          if (idx === -1) {
            db.books.unshift(cb);
          } else if (new Date(cb.updatedAt) > new Date(db.books[idx].updatedAt)) {
            db.books[idx] = cb;
          }
        });
      }
      if (Array.isArray(clientState.borrowers)) {
        clientState.borrowers.forEach((cbr: Borrower) => {
          const idx = db.borrowers.findIndex((b) => b.id === cbr.id);
          if (idx === -1) {
            db.borrowers.unshift(cbr);
          }
        });
      }
      if (Array.isArray(clientState.loans)) {
        clientState.loans.forEach((cl: Loan) => {
          const idx = db.loans.findIndex((l) => l.id === cl.id);
          if (idx === -1) {
            db.loans.unshift(cl);
          }
        });
      }
      saveDatabase(db);
    }

    refreshLoanStatuses();
    res.json({
      success: true,
      serverState: {
        regions: db.regions,
        books: db.books,
        borrowers: db.borrowers,
        loans: db.loans,
        reminders: db.reminders,
        lastUpdated: db.lastUpdated,
      },
    });
  });

  // Vite development middleware or Production static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BLibrary server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
