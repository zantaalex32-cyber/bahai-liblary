import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  UserCheck,
  RotateCcw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Loan, Book, Borrower } from '../types';

interface LoansManagerProps {
  loans: Loan[];
  books: Book[];
  borrowers: Borrower[];
  onCheckout: (bookId: string, borrowerId: string, loanDays?: number, notes?: string) => Promise<void>;
  onReturn: (loanId: string, notes?: string) => Promise<void>;
  onRenew: (loanId: string, extraDays?: number) => Promise<void>;
  onOpenReminderModal: (loan: Loan) => void;
  preselectedBook?: Book | null;
  preselectedBorrower?: Borrower | null;
  onClearPreselections?: () => void;
}

export const LoansManager: React.FC<LoansManagerProps> = ({
  loans,
  books,
  borrowers,
  onCheckout,
  onReturn,
  onRenew,
  onOpenReminderModal,
  preselectedBook,
  preselectedBorrower,
  onClearPreselections,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'overdue' | 'returned'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(
    Boolean(preselectedBook || preselectedBorrower)
  );

  // New checkout state
  const [selectedBookId, setSelectedBookId] = useState(preselectedBook?.id || '');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(preselectedBorrower?.id || '');
  const [loanDays, setLoanDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return modal state
  const [returnLoanTarget, setReturnLoanTarget] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState('Excellent Condition');

  const filteredLoans = loans.filter((loan) => {
    if (filterTab === 'active' && loan.status !== 'Active') return false;
    if (filterTab === 'overdue' && loan.status !== 'Overdue') return false;
    if (filterTab === 'returned' && loan.status !== 'Returned') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const book = books.find((b) => b.id === loan.bookId);
      const borrower = borrowers.find((br) => br.id === loan.borrowerId);
      const titleMatch = book?.title.toLowerCase().includes(q) || false;
      const borrowerMatch = borrower?.name.toLowerCase().includes(q) || false;
      const accessionMatch = book?.accessionNumber.toLowerCase().includes(q) || false;
      return titleMatch || borrowerMatch || accessionMatch;
    }
    return true;
  });

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedBorrowerId) return;

    setIsSubmitting(true);
    try {
      await onCheckout(selectedBookId, selectedBorrowerId, Number(loanDays), notes.trim());
      setIsCheckoutModalOpen(false);
      if (onClearPreselections) onClearPreselections();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnLoanTarget) return;
    try {
      await onReturn(returnLoanTarget.id, `Returned in ${returnCondition}`);
      setReturnLoanTarget(null);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Return failed:', err);
    }
  };

  const overdueCount = loans.filter((l) => l.status === 'Overdue').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-6 text-stone-100 shadow-xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold tracking-wide">
            CIRCULATION & LOANS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
            Loan Circulation & Book Returns
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-xl">
            Issue book checkouts, process returns with condition notes, renew active loans, and monitor overdue returns.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedBookId(preselectedBook?.id || (books.find((b) => b.availableCopies > 0)?.id || ''));
            setSelectedBorrowerId(preselectedBorrower?.id || (borrowers[0]?.id || ''));
            setIsCheckoutModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-colors whitespace-nowrap"
          id="new-checkout-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Book Checkout</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search loans by book title, borrower name, or accession ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            id="search-loans-input"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filterTab === 'active'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active Loans ({loans.filter((l) => l.status === 'Active').length})
          </button>

          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 ${
              filterTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue ({overdueCount})</span>
          </button>

          <button
            onClick={() => setFilterTab('returned')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filterTab === 'returned'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Returned ({loans.filter((l) => l.status === 'Returned').length})
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filterTab === 'all'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
            <tr>
              <th className="p-3.5">Book Details</th>
              <th className="p-3.5">Borrower</th>
              <th className="p-3.5">Issue Date</th>
              <th className="p-3.5">Due Date</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-500">
                  No loan records found under selected filter.
                </td>
              </tr>
            ) : (
              filteredLoans.map((loan) => {
                const book = books.find((b) => b.id === loan.bookId);
                const borrower = borrowers.find((br) => br.id === loan.borrowerId);
                const isOverdue = loan.status === 'Overdue';

                return (
                  <tr
                    key={loan.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      isOverdue ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="font-serif font-bold text-stone-900 text-sm">
                        {book?.title || 'Unknown Title'}
                      </div>
                      <div className="text-[11px] font-mono text-stone-500">
                        {book?.accessionNumber} | Barcode: {book?.barcode}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">{borrower?.name || 'Unknown Member'}</div>
                      <div className="text-[11px] text-stone-500">{borrower?.email}</div>
                    </td>

                    <td className="p-3.5 font-mono text-stone-700">{loan.issueDate}</td>

                    <td className="p-3.5">
                      <div className={`font-mono font-bold ${isOverdue ? 'text-rose-700' : 'text-stone-800'}`}>
                        {loan.dueDate}
                      </div>
                      {loan.returnDate && (
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Returned: {loan.returnDate}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          loan.status === 'Returned'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{loan.status}</span>
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      {loan.status !== 'Returned' && (
                        <>
                          <button
                            onClick={() => setReturnLoanTarget(loan)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                          >
                            Return Book
                          </button>

                          <button
                            onClick={() => onRenew(loan.id, 14)}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Extend loan due date by 14 days"
                          >
                            Renew +14d
                          </button>

                          {isOverdue && (
                            <button
                              onClick={() => onOpenReminderModal(loan)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition-colors inline-flex items-center space-x-1"
                              title="Compose & Send Overdue Email Reminder"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Send Reminder</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg">New Book Checkout</h3>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
              {/* Select Book */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Select Book *</label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                  id="checkout-book-select"
                >
                  <option value="">-- Choose Book from Inventory --</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.accessionNumber}) - {b.availableCopies} available
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Borrower */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Select Borrower *</label>
                <select
                  required
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                  id="checkout-borrower-select"
                >
                  <option value="">-- Choose Member/Borrower --</option>
                  {borrowers.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name} ({br.memberId}) - {br.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 uppercase">Loan Period</label>
                  <select
                    value={loanDays}
                    onChange={(e) => setLoanDays(parseInt(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                  >
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (2 Weeks)</option>
                    <option value={21}>21 Days (3 Weeks)</option>
                    <option value={30}>30 Days (1 Month)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 uppercase">Calculated Due Date</label>
                  <div className="bg-stone-100 text-stone-900 font-mono text-xs font-bold p-2.5 rounded-lg border border-stone-200">
                    {
                      new Date(new Date().getTime() + loanDays * 24 * 3600 * 1000)
                        .toISOString()
                        .split('T')[0]
                    }
                  </div>
                </div>
              </div>

              {/* Loan Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Requested for youth deepening class..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow"
                  id="confirm-checkout-btn"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Book Confirmation Modal */}
      {returnLoanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-emerald-900 text-emerald-100 p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-serif font-bold text-lg">Return Book Copy</h3>
              </div>
              <button
                onClick={() => setReturnLoanTarget(null)}
                className="text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-stone-700">
                Confirm return of book copy to active inventory:
              </p>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs space-y-1">
                <div className="font-bold text-stone-900">
                  {books.find((b) => b.id === returnLoanTarget.bookId)?.title}
                </div>
                <div className="text-stone-500">
                  Borrower: {borrowers.find((b) => b.id === returnLoanTarget.borrowerId)?.name}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Item Condition Note</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-lg p-2.5"
                >
                  <option value="Excellent Condition">Excellent / Clean Condition</option>
                  <option value="Minor Wear">Minor Wear / Good Condition</option>
                  <option value="Needs Binding Touch-up">Needs Binding Touch-up</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  onClick={() => setReturnLoanTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow"
                >
                  Complete Book Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
