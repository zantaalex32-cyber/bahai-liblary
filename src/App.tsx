import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BookCatalog } from './components/BookCatalog';
import { BorrowersManager } from './components/BorrowersManager';
import { LoansManager } from './components/LoansManager';
import { EmailReminderStudio } from './components/EmailReminderStudio';
import { LabelPrinterStudio } from './components/LabelPrinterStudio';
import { AddBookModal } from './components/AddBookModal';
import { BookDetailModal } from './components/BookDetailModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { RegionManagerModal } from './components/RegionManagerModal';
import { Book, Borrower, Loan, Region, EmailReminder, SyncState } from './types';
import { apiService, getLocalData, saveLocalData } from './services/apiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'borrowers' | 'loans' | 'reminders' | 'labels'>('catalog');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');

  // Core Data
  const [regions, setRegions] = useState<Region[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reminders, setReminders] = useState<EmailReminder[]>([]);

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncedAt: null,
    pendingChanges: 0,
  });

  // Modal controls
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRegionManagerOpen, setIsRegionManagerOpen] = useState(false);

  // Preselected modal targets
  const [checkoutBookTarget, setCheckoutBookTarget] = useState<Book | null>(null);
  const [checkoutBorrowerTarget, setCheckoutBorrowerTarget] = useState<Borrower | null>(null);
  const [reminderLoanTarget, setReminderLoanTarget] = useState<Loan | null>(null);
  const [printLabelBookTarget, setPrintLabelBookTarget] = useState<Book | null>(null);

  // Initial load & Sync
  const loadAndSyncData = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, isSyncing: true }));
    try {
      const { data, isOnline } = await apiService.syncData();
      setRegions(data.regions);
      setBooks(data.books);
      setBorrowers(data.borrowers);
      setLoans(data.loans);
      setReminders(data.reminders);
      setSyncState({
        isOnline,
        isSyncing: false,
        lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
        pendingChanges: 0,
      });
    } catch (err) {
      console.warn('Sync failed, loading local:', err);
      const local = getLocalData();
      setRegions(local.regions);
      setBooks(local.books);
      setBorrowers(local.borrowers);
      setLoans(local.loans);
      setReminders(local.reminders);
      setSyncState({
        isOnline: false,
        isSyncing: false,
        lastSyncedAt: local.lastSyncedAt,
        pendingChanges: 0,
      });
    }
  }, []);

  useEffect(() => {
    loadAndSyncData();
  }, [loadAndSyncData]);

  // Handlers for Books
  const handleSaveBook = async (bookData: Partial<Book>) => {
    if (editingBook) {
      await apiService.updateBook(editingBook.id, bookData);
      setEditingBook(null);
    } else {
      await apiService.addBook(bookData);
    }
    await loadAndSyncData();
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this book from the catalog?')) {
      await apiService.deleteBook(id);
      await loadAndSyncData();
    }
  };

  // Handlers for Borrowers
  const handleAddBorrower = async (borrowerData: Partial<Borrower>) => {
    await apiService.addBorrower(borrowerData);
    await loadAndSyncData();
  };

  // Handlers for Loans
  const handleCheckoutLoan = async (bookId: string, borrowerId: string, loanDays = 14, notes = '') => {
    await apiService.checkoutLoan(bookId, borrowerId, loanDays, notes);
    await loadAndSyncData();
  };

  const handleReturnLoan = async (loanId: string, notes = '') => {
    await apiService.returnLoan(loanId, notes);
    await loadAndSyncData();
  };

  const handleRenewLoan = async (loanId: string, extraDays = 14) => {
    await apiService.renewLoan(loanId, extraDays);
    await loadAndSyncData();
  };

  // Handlers for Regions
  const handleAddRegion = async (regData: { code: string; name: string; location: string; contactEmail: string }) => {
    await fetch('/api/regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    });
    await loadAndSyncData();
  };

  const overdueCount = loans.filter((l) => l.status === 'Overdue').length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans antialiased">
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        regions={regions}
        selectedRegionId={selectedRegionId}
        setSelectedRegionId={setSelectedRegionId}
        overdueCount={overdueCount}
        syncState={syncState}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddBook={() => {
          setEditingBook(null);
          setIsAddBookOpen(true);
        }}
        onOpenRegionManager={() => setIsRegionManagerOpen(true)}
        onTriggerSync={loadAndSyncData}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-16">
        {activeTab === 'catalog' && (
          <BookCatalog
            books={books}
            regions={regions}
            selectedRegionId={selectedRegionId}
            onSelectBook={(b) => setSelectedBookDetail(b)}
            onOpenAddBook={() => {
              setEditingBook(null);
              setIsAddBookOpen(true);
            }}
            onCheckoutBook={(b) => {
              setCheckoutBookTarget(b);
              setActiveTab('loans');
            }}
            onDeleteBook={handleDeleteBook}
            onPrintLabel={(b) => {
              setPrintLabelBookTarget(b);
              setActiveTab('labels');
            }}
          />
        )}

        {activeTab === 'borrowers' && (
          <BorrowersManager
            borrowers={borrowers}
            regions={regions}
            loans={loans}
            books={books}
            selectedRegionId={selectedRegionId}
            onAddBorrower={handleAddBorrower}
            onSelectBorrowerForCheckout={(br) => {
              setCheckoutBorrowerTarget(br);
              setActiveTab('loans');
            }}
          />
        )}

        {activeTab === 'loans' && (
          <LoansManager
            loans={loans}
            books={books}
            borrowers={borrowers}
            onCheckout={handleCheckoutLoan}
            onReturn={handleReturnLoan}
            onRenew={handleRenewLoan}
            onOpenReminderModal={(loan) => {
              setReminderLoanTarget(loan);
              setActiveTab('reminders');
            }}
            preselectedBook={checkoutBookTarget}
            preselectedBorrower={checkoutBorrowerTarget}
            onClearPreselections={() => {
              setCheckoutBookTarget(null);
              setCheckoutBorrowerTarget(null);
            }}
          />
        )}

        {activeTab === 'reminders' && (
          <EmailReminderStudio
            loans={loans}
            books={books}
            borrowers={borrowers}
            reminders={reminders}
            onRefreshData={loadAndSyncData}
            preselectedLoanForReminder={reminderLoanTarget}
            onClearPreselection={() => setReminderLoanTarget(null)}
          />
        )}

        {activeTab === 'labels' && (
          <LabelPrinterStudio
            books={books}
            regions={regions}
            selectedRegionId={selectedRegionId}
            preselectedBookForPrint={printLabelBookTarget}
          />
        )}
      </main>

      {/* Modals */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        regions={regions}
        onSaveBook={handleSaveBook}
        editBook={editingBook}
      />

      <BookDetailModal
        book={selectedBookDetail}
        onClose={() => setSelectedBookDetail(null)}
        regions={regions}
        onCheckout={(b) => {
          setCheckoutBookTarget(b);
          setActiveTab('loans');
        }}
        onPrintLabel={(b) => {
          setPrintLabelBookTarget(b);
          setActiveTab('labels');
        }}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        books={books}
        borrowers={borrowers}
        onSelectBookForDetails={(b) => setSelectedBookDetail(b)}
        onQuickCheckout={(b) => {
          setCheckoutBookTarget(b);
          setActiveTab('loans');
        }}
      />

      <RegionManagerModal
        isOpen={isRegionManagerOpen}
        onClose={() => setIsRegionManagerOpen(false)}
        regions={regions}
        onAddRegion={handleAddRegion}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-6 border-t border-stone-800 text-center font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-stone-200">Bahai Library (BLibrary)</span>
            <span>•</span>
            <span>Multi-Regional Inventory & Borrowers System</span>
          </div>
          <div className="font-mono text-[11px] text-stone-500">
            Offline Capable • Real-Time Device Sync • Barcode Cataloging
          </div>
        </div>
      </footer>
    </div>
  );
}
