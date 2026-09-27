import { Book, Borrower, Loan, Region, EmailReminder, SyncState } from '../types';
import { INITIAL_BOOKS, INITIAL_BORROWERS, INITIAL_LOANS, INITIAL_REGIONS, INITIAL_REMINDERS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'blibrary_offline_data_v1';

interface LocalStorageData {
  regions: Region[];
  books: Book[];
  borrowers: Borrower[];
  loans: Loan[];
  reminders: EmailReminder[];
  lastSyncedAt: string | null;
}

export function getLocalData(): LocalStorageData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse local storage:', e);
  }
  const defaultData: LocalStorageData = {
    regions: INITIAL_REGIONS,
    books: INITIAL_BOOKS,
    borrowers: INITIAL_BORROWERS,
    loans: INITIAL_LOANS,
    reminders: INITIAL_REMINDERS,
    lastSyncedAt: new Date().toISOString(),
  };
  saveLocalData(defaultData);
  return defaultData;
}

export function saveLocalData(data: LocalStorageData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local storage:', e);
  }
}

export const apiService = {
  // Sync
  async syncData(): Promise<{ data: LocalStorageData; isOnline: boolean }> {
    const local = getLocalData();
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientState: local }),
      });
      if (res.ok) {
        const json = await res.json();
        const serverData: LocalStorageData = {
          regions: json.serverState.regions,
          books: json.serverState.books,
          borrowers: json.serverState.borrowers,
          loans: json.serverState.loans,
          reminders: json.serverState.reminders,
          lastSyncedAt: json.serverState.lastUpdated,
        };
        saveLocalData(serverData);
        return { data: serverData, isOnline: true };
      }
    } catch (err) {
      console.warn('Backend server sync offline, falling back to client storage:', err);
    }
    return { data: local, isOnline: false };
  },

  // Books
  async addBook(bookData: Partial<Book>): Promise<Book> {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API error, saving locally:', e);
    }

    const local = getLocalData();
    const regionCode = local.regions.find((r) => r.id === bookData.regionId)?.code || 'GEN';
    const nextNum = local.books.filter((b) => b.regionId === bookData.regionId).length + 1001;
    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: bookData.title || 'Untitled Book',
      author: bookData.author || 'Unknown Author',
      translator: bookData.translator || '',
      category: bookData.category || 'Sacred Writings',
      regionId: bookData.regionId || local.regions[0].id,
      accessionNumber: bookData.accessionNumber || `BL-${regionCode}-${nextNum}`,
      barcode: bookData.barcode || `${regionCode}${Date.now().toString().slice(-8)}`,
      isbn: bookData.isbn || '',
      publisher: bookData.publisher || '',
      publishYear: bookData.publishYear ? Number(bookData.publishYear) : undefined,
      language: bookData.language || 'English',
      shelfLocation: bookData.shelfLocation || 'Shelf A-1',
      totalCopies: Number(bookData.totalCopies || 1),
      availableCopies: Number(bookData.totalCopies || 1),
      description: bookData.description || '',
      coverUrl: bookData.coverUrl || '',
      tags: bookData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    local.books.unshift(newBook);
    saveLocalData(local);
    return newBook;
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API update failed, applying locally:', e);
    }
    const local = getLocalData();
    const idx = local.books.findIndex((b) => b.id === id);
    if (idx !== -1) {
      local.books[idx] = { ...local.books[idx], ...updates, updatedAt: new Date().toISOString() };
      saveLocalData(local);
      return local.books[idx];
    }
    throw new Error('Book not found');
  },

  async deleteBook(id: string): Promise<void> {
    try {
      await fetch(`/api/books/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API delete failed, applying locally:', e);
    }
    const local = getLocalData();
    local.books = local.books.filter((b) => b.id !== id);
    saveLocalData(local);
  },

  // Borrowers
  async addBorrower(borrowerData: Partial<Borrower>): Promise<Borrower> {
    try {
      const res = await fetch('/api/borrowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(borrowerData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API error, adding borrower locally:', e);
    }
    const local = getLocalData();
    const memberId = `MEM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newBorrower: Borrower = {
      id: `bor-${Date.now()}`,
      name: borrowerData.name || 'Member',
      email: borrowerData.email || '',
      phone: borrowerData.phone || '',
      regionId: borrowerData.regionId || local.regions[0].id,
      memberId,
      address: borrowerData.address || '',
      activeLoansCount: 0,
      status: 'Active',
      notes: borrowerData.notes || '',
      createdAt: new Date().toISOString(),
    };
    local.borrowers.unshift(newBorrower);
    saveLocalData(local);
    return newBorrower;
  },

  // Checkout
  async checkoutLoan(bookId: string, borrowerId: string, loanDays = 14, notes = ''): Promise<Loan> {
    try {
      const res = await fetch('/api/loans/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, borrowerId, loanDays, notes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API checkout failed, applying locally:', e);
    }

    const local = getLocalData();
    const book = local.books.find((b) => b.id === bookId);
    const borrower = local.borrowers.find((br) => br.id === borrowerId);
    if (!book || !borrower) throw new Error('Book or Borrower not found');
    if (book.availableCopies <= 0) throw new Error('No available copies');

    const issueDateObj = new Date();
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + loanDays);

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
    local.loans.unshift(newLoan);
    saveLocalData(local);
    return newLoan;
  },

  // Return
  async returnLoan(loanId: string, notes = ''): Promise<void> {
    try {
      const res = await fetch('/api/loans/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, notes }),
      });
      if (res.ok) return;
    } catch (e) {
      console.warn('API return failed, applying locally:', e);
    }

    const local = getLocalData();
    const loan = local.loans.find((l) => l.id === loanId);
    if (loan) {
      loan.status = 'Returned';
      loan.returnDate = new Date().toISOString().split('T')[0];
      if (notes) loan.notes = (loan.notes ? loan.notes + ' | ' : '') + notes;

      const book = local.books.find((b) => b.id === loan.bookId);
      if (book && book.availableCopies < book.totalCopies) book.availableCopies += 1;

      const borrower = local.borrowers.find((br) => br.id === loan.borrowerId);
      if (borrower && borrower.activeLoansCount > 0) borrower.activeLoansCount -= 1;

      saveLocalData(local);
    }
  },

  // Renew
  async renewLoan(loanId: string, extraDays = 14): Promise<void> {
    try {
      const res = await fetch('/api/loans/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, extraDays }),
      });
      if (res.ok) return;
    } catch (e) {
      console.warn('API renew failed, applying locally:', e);
    }

    const local = getLocalData();
    const loan = local.loans.find((l) => l.id === loanId);
    if (loan) {
      const currentDue = new Date(loan.dueDate);
      currentDue.setDate(currentDue.getDate() + extraDays);
      loan.dueDate = currentDue.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      if (loan.dueDate >= today) loan.status = 'Active';
      saveLocalData(local);
    }
  },

  // AI Gemini Email Generator
  async generateGeminiReminder(borrowerName: string, bookTitle: string, dueDate: string, daysOverdue: number, tone = 'gentle & encouraging') {
    const res = await fetch('/api/gemini/generate-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowerName, bookTitle, dueDate, daysOverdue, tone }),
    });
    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Failed to generate reminder from Gemini AI');
    }
    return await res.json();
  },

  // AI Gemini Catalog Auto-Fill
  async autoCatalogWithGemini(title: string, author?: string) {
    const res = await fetch('/api/gemini/catalog-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author }),
    });
    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Failed to auto-catalog book via Gemini AI');
    }
    return await res.json();
  },

  // Send Reminder Email
  async sendEmailReminder(loanId: string, customSubject?: string, customBody?: string): Promise<EmailReminder> {
    try {
      const res = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, customSubject, customBody }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.reminder;
      }
    } catch (e) {
      console.warn('API send reminder failed, applying locally:', e);
    }

    const local = getLocalData();
    const loan = local.loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    const borrower = local.borrowers.find((b) => b.id === loan.borrowerId);
    const book = local.books.find((b) => b.id === loan.bookId);
    if (!borrower || !book) throw new Error('Borrower or Book not found');

    const reminder: EmailReminder = {
      id: `rem-${Date.now()}`,
      loanId: loan.id,
      borrowerId: borrower.id,
      borrowerEmail: borrower.email,
      borrowerName: borrower.name,
      bookTitle: book.title,
      dueDate: loan.dueDate,
      daysOverdue: Math.max(0, Math.floor((new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 3600 * 24))),
      subject: customSubject || `[BLibrary] Overdue Notice: ${book.title}`,
      body: customBody || `Dear ${borrower.name},\n\nKindly return ${book.title}.`,
      sentAt: new Date().toISOString(),
      status: 'Sent',
      triggerType: 'Manual Dispatch',
    };

    loan.reminderCount += 1;
    loan.lastReminderSentAt = reminder.sentAt;
    local.reminders.unshift(reminder);
    saveLocalData(local);
    return reminder;
  },

  // Automate All Overdue Reminders
  async automateAllOverdueReminders(): Promise<{ count: number; reminders: EmailReminder[] }> {
    try {
      const res = await fetch('/api/reminders/automate-all', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        return { count: json.processedCount, reminders: json.sentReminders };
      }
    } catch (e) {
      console.warn('API automate reminders failed, running locally:', e);
    }

    const local = getLocalData();
    const today = new Date().toISOString().split('T')[0];
    const overdueLoans = local.loans.filter((l) => l.status === 'Overdue' || (l.status !== 'Returned' && l.dueDate < today));
    const newReminders: EmailReminder[] = [];

    overdueLoans.forEach((loan) => {
      loan.status = 'Overdue';
      const borrower = local.borrowers.find((b) => b.id === loan.borrowerId);
      const book = local.books.find((b) => b.id === loan.bookId);
      if (!borrower || !book) return;

      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 3600 * 24)));
      const reminder: EmailReminder = {
        id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        loanId: loan.id,
        borrowerId: borrower.id,
        borrowerEmail: borrower.email,
        borrowerName: borrower.name,
        bookTitle: book.title,
        dueDate: loan.dueDate,
        daysOverdue,
        subject: `[Automated BLibrary] Friendly Reminder: ${book.title}`,
        body: `Dear ${borrower.name},\n\nPlease return ${book.title} which was due on ${loan.dueDate}.\n\nWarm regards,\nBLibrary Team`,
        sentAt: new Date().toISOString(),
        status: 'Sent',
        triggerType: 'Automated Cron',
      };
      loan.reminderCount += 1;
      loan.lastReminderSentAt = reminder.sentAt;
      local.reminders.unshift(reminder);
      newReminders.push(reminder);
    });

    saveLocalData(local);
    return { count: newReminders.length, reminders: newReminders };
  },
};
