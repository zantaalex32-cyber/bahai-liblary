export type BookCategory =
  | 'Sacred Writings'
  | 'Baha\'i History'
  | 'Introductory & Principles'
  | 'Administration & Covenant'
  | 'Youth & Children'
  | 'Devotional & Prayers'
  | 'Deepening & Study'
  | 'Biographies & Memoirs';

export interface Region {
  id: string;
  code: string;
  name: string;
  location: string;
  contactEmail: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  translator?: string;
  category: BookCategory;
  regionId: string;
  accessionNumber: string; // e.g. BL-NA-1001
  barcode: string; // Barcode value string e.g. 9780877432001 or BL978001
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  language: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  description: string;
  coverUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Borrower {
  id: string;
  name: string;
  email: string;
  phone: string;
  regionId: string;
  memberId: string; // e.g. MEM-2026-042
  address?: string;
  activeLoansCount: number;
  status: 'Active' | 'Suspended' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  bookId: string;
  borrowerId: string;
  copyNumber: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  status: 'Active' | 'Returned' | 'Overdue';
  notes?: string;
  reminderCount: number;
  lastReminderSentAt?: string;
}

export interface EmailReminder {
  id: string;
  loanId: string;
  borrowerId: string;
  borrowerEmail: string;
  borrowerName: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
  subject: string;
  body: string;
  sentAt: string;
  status: 'Sent' | 'Failed' | 'Queued';
  triggerType: 'Automated Cron' | 'Manual Dispatch' | 'Batch Trigger';
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingChanges: number;
}

export interface PrintableLabelConfig {
  labelWidthMm: number;
  labelHeightMm: number;
  includeQrCode: boolean;
  includeTitle: boolean;
  includeAuthor: boolean;
  includeRegion: boolean;
  includeShelf: boolean;
  fontSize: 'small' | 'medium' | 'large';
  layoutColumns: number;
}
