import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { Borrower, Loan, Region, Book } from '../types';

interface BorrowersManagerProps {
  borrowers: Borrower[];
  regions: Region[];
  loans: Loan[];
  books: Book[];
  selectedRegionId: string;
  onAddBorrower: (borrowerData: Partial<Borrower>) => Promise<void>;
  onSelectBorrowerForCheckout?: (borrower: Borrower) => void;
}

export const BorrowersManager: React.FC<BorrowersManagerProps> = ({
  borrowers,
  regions,
  loans,
  books,
  selectedRegionId,
  onAddBorrower,
  onSelectBorrowerForCheckout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  // New Borrower form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regionId, setRegionId] = useState(regions[0]?.id || 'reg-na');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredBorrowers = borrowers.filter((b) => {
    if (selectedRegionId !== 'ALL' && b.regionId !== selectedRegionId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.memberId.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddBorrower({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        regionId,
        address: address.trim(),
        notes: notes.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating borrower:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegionName = (regId: string) => {
    const r = regions.find((reg) => reg.id === regId);
    return r ? `[${r.code}] ${r.name}` : 'Regional Center';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-6 text-stone-100 shadow-xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold tracking-wide">
            BORROWER MANAGEMENT
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
            Library Members & Borrowers
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-xl">
            Track borrower profiles, active loans, borrowing history, and contact details across regional communities.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-colors whitespace-nowrap"
          id="add-borrower-btn"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Borrower</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search borrowers by name, email, phone, or Member ID (e.g. MEM-2026-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            id="search-borrower-input"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-stone-600">
          <span className="bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            Total Borrowers: <strong className="text-stone-900">{filteredBorrowers.length}</strong>
          </span>
          <span className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-900">
            Active Loans Total:{' '}
            <strong className="text-amber-800">
              {filteredBorrowers.reduce((acc, b) => acc + b.activeLoansCount, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Borrowers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBorrowers.map((borrower) => {
          const borrowerLoans = loans.filter((l) => l.borrowerId === borrower.id && l.status !== 'Returned');
          const overdueLoansCount = borrowerLoans.filter((l) => l.status === 'Overdue').length;

          return (
            <div
              key={borrower.id}
              className="bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold font-serif flex items-center justify-center text-base border border-amber-300">
                      {borrower.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-base">{borrower.name}</h3>
                      <p className="text-[11px] font-mono text-stone-500 font-semibold">{borrower.memberId}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      borrower.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {borrower.status}
                  </span>
                </div>

                {/* Contact info */}
                <div className="text-xs text-stone-600 space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <a href={`mailto:${borrower.email}`} className="hover:underline text-amber-800">
                      {borrower.email}
                    </a>
                  </div>
                  {borrower.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{borrower.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{getRegionName(borrower.regionId)}</span>
                  </div>
                </div>

                {/* Active Loans summary */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-stone-500 font-medium">Active Borrowed Books:</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded ${
                      overdueLoansCount > 0
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : borrower.activeLoansCount > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {borrower.activeLoansCount} Active
                    {overdueLoansCount > 0 && ` (${overdueLoansCount} OVERDUE)`}
                  </span>
                </div>

                {borrower.notes && (
                  <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                    "{borrower.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedBorrower(borrower)}
                  className="text-xs text-amber-800 hover:text-amber-900 font-bold hover:underline"
                >
                  View Loan History
                </button>

                {onSelectBorrowerForCheckout && (
                  <button
                    onClick={() => onSelectBorrowerForCheckout(borrower)}
                    className="bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                  >
                    Select for Checkout
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Borrower Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg">Register Borrower / Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBorrower} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tahirih Alborzi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                  id="add-borrower-name-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. member@example.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
                    id="add-borrower-email-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Library Region *</label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                >
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      [{reg.code}] {reg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Address / Location</label>
                <input
                  type="text"
                  placeholder="Street, City, Postal Code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 uppercase">Notes / Community Role</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Study class teacher, Youth coordinator..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow"
                  id="save-borrower-submit-btn"
                >
                  {isSubmitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrower History Modal */}
      {selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">{selectedBorrower.name}</h3>
                <p className="text-xs text-stone-400">
                  Member ID: {selectedBorrower.memberId} | {selectedBorrower.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedBorrower(null)}
                className="text-stone-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Borrowing History & Active Loans
              </h4>

              {loans.filter((l) => l.borrowerId === selectedBorrower.id).length === 0 ? (
                <p className="text-xs text-stone-500 bg-stone-50 p-4 rounded-lg text-center">
                  No borrowing activity logged for this member yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {loans
                    .filter((l) => l.borrowerId === selectedBorrower.id)
                    .map((loan) => {
                      const book = books.find((b) => b.id === loan.bookId);

                      return (
                        <div
                          key={loan.id}
                          className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-serif font-bold text-stone-900 text-sm">
                              {book?.title || 'Unknown Book'}
                            </div>
                            <div className="text-stone-500 font-mono text-[11px] mt-0.5">
                              Issued: {loan.issueDate} | Due: {loan.dueDate}
                              {loan.returnDate && ` | Returned: ${loan.returnDate}`}
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] self-start sm:self-center ${
                              loan.status === 'Returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : loan.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 text-right">
              <button
                onClick={() => setSelectedBorrower(null)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
