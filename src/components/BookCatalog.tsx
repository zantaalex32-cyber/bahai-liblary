import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Plus,
  BookOpen,
  QrCode,
  Tag,
  MapPin,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Bookmark,
  Share2,
} from 'lucide-react';
import { Book, BookCategory, Region } from '../types';
import { BarcodeSVG } from '../utils/barcodeGenerator';

interface BookCatalogProps {
  books: Book[];
  regions: Region[];
  selectedRegionId: string;
  onSelectBook: (book: Book) => void;
  onOpenAddBook: () => void;
  onCheckoutBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onPrintLabel: (book: Book) => void;
}

const CATEGORIES: (BookCategory | 'All')[] = [
  'All',
  'Sacred Writings',
  'Baha\'i History',
  'Introductory & Principles',
  'Administration & Covenant',
  'Youth & Children',
  'Devotional & Prayers',
  'Deepening & Study',
  'Biographies & Memoirs',
];

export const BookCatalog: React.FC<BookCatalogProps> = ({
  books,
  regions,
  selectedRegionId,
  onSelectBook,
  onOpenAddBook,
  onCheckoutBook,
  onDeleteBook,
  onPrintLabel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'borrowed'>('all');

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Region filter
      if (selectedRegionId !== 'ALL' && book.regionId !== selectedRegionId) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All' && book.category !== selectedCategory) {
        return false;
      }
      // Availability filter
      if (availabilityFilter === 'available' && book.availableCopies <= 0) {
        return false;
      }
      if (availabilityFilter === 'borrowed' && book.availableCopies === book.totalCopies) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesAuthor = book.author.toLowerCase().includes(q);
        const matchesAccession = book.accessionNumber.toLowerCase().includes(q);
        const matchesBarcode = book.barcode.toLowerCase().includes(q);
        const matchesIsbn = book.isbn?.toLowerCase().includes(q) || false;
        const matchesTags = book.tags.some((t) => t.toLowerCase().includes(q));
        return matchesTitle || matchesAuthor || matchesAccession || matchesBarcode || matchesIsbn || matchesTags;
      }
      return true;
    });
  }, [books, selectedRegionId, selectedCategory, availabilityFilter, searchQuery]);

  const getRegionCode = (regionId: string) => {
    const reg = regions.find((r) => r.id === regionId);
    return reg ? reg.code : 'GEN';
  };

  return (
    <div className="space-[#1a1a1a] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Stats summary */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-6 text-stone-100 shadow-xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold tracking-wide">
            ORGANIZED INVENTORY
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-stone-50">
            Literature & Book Catalog
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-xl">
            Unified catalog across multi-regional libraries with accession numbering, barcode labels, and copy availability tracking.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-stone-900/80 p-3 rounded-xl border border-stone-800/80 text-center min-w-[280px]">
          <div>
            <div className="text-xl font-bold font-mono text-amber-400">{filteredBooks.length}</div>
            <div className="text-[11px] text-stone-400 font-medium">Total Titles</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {filteredBooks.reduce((acc, b) => acc + b.availableCopies, 0)}
            </div>
            <div className="text-[11px] text-stone-400 font-medium">Available</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {filteredBooks.reduce((acc, b) => acc + (b.totalCopies - b.availableCopies), 0)}
            </div>
            <div className="text-[11px] text-stone-400 font-medium">Borrowed</div>
          </div>
        </div>
      </div>

      {/* Search & Control Toolbar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Title, Author, Barcode, Accession ID (e.g. BL-NA-1001), or Tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 transition-colors"
              id="book-catalog-search-input"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              id="availability-filter-select"
            >
              <option value="all">All Copies Status</option>
              <option value="available">Available Now Only</option>
              <option value="borrowed">Currently Borrowed</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Grid Cards View"
                id="view-mode-grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Compact Table View"
                id="view-mode-table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add Book Button */}
            <button
              onClick={onOpenAddBook}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              id="add-book-catalog-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Book</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-900 text-amber-100 font-semibold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid or Table View */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-stone-200 shadow-xs space-y-3">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No books found in catalog</h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto">
            Try adjusting your search criteria or add new books to your regional Baha'i library inventory.
          </p>
          <button
            onClick={onOpenAddBook}
            className="inline-flex items-center space-x-2 bg-amber-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Book</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            const regCode = getRegionCode(book.regionId);

            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Book Card Top Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-stone-100 text-stone-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-stone-200">
                      {book.accessionNumber}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{book.availableCopies}/{book.totalCopies} Avail</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>All Borrowed</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3
                      onClick={() => onSelectBook(book)}
                      className="font-serif font-bold text-stone-900 text-base line-clamp-2 hover:text-amber-700 cursor-pointer transition-colors"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-600 font-medium mt-1">By {book.author}</p>
                  </div>

                  {/* Category & Region */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200/60">
                      {book.category}
                    </span>
                    <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded flex items-center space-x-1 border border-stone-200">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{regCode} Region</span>
                    </span>
                  </div>

                  {/* Shelf Location & Language */}
                  <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded border border-stone-100 space-y-1">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-semibold text-stone-700">{book.shelfLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Language:</span>
                      <span className="text-stone-700 font-medium">{book.language}</span>
                    </div>
                  </div>

                  {/* Mini Barcode Preview */}
                  <div
                    onClick={() => onPrintLabel(book)}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    title="Click to open Barcode Label Printer"
                  >
                    <BarcodeSVG value={book.barcode} height={40} showValueText={true} />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectBook(book)}
                    className="flex-1 text-center bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => onCheckoutBook(book)}
                    disabled={!isAvailable}
                    className={`flex-1 text-center text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors ${
                      isAvailable
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    Checkout
                  </button>

                  <button
                    onClick={() => onDeleteBook(book.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200 rounded-lg transition-colors"
                    title="Delete book from catalog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">Accession ID</th>
                <th className="p-3">Title & Author</th>
                <th className="p-3">Category</th>
                <th className="p-3">Region</th>
                <th className="p-3">Shelf Location</th>
                <th className="p-3">Barcode</th>
                <th className="p-3 text-center">Copies</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBooks.map((book) => {
                const isAvailable = book.availableCopies > 0;
                const regCode = getRegionCode(book.regionId);

                return (
                  <tr key={book.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-stone-900">{book.accessionNumber}</td>
                    <td className="p-3">
                      <div
                        onClick={() => onSelectBook(book)}
                        className="font-serif font-bold text-stone-900 hover:text-amber-700 cursor-pointer"
                      >
                        {book.title}
                      </div>
                      <div className="text-[11px] text-stone-500">{book.author}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded border border-amber-200">
                        {book.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-stone-800">{regCode}</td>
                    <td className="p-3 text-stone-600">{book.shelfLocation}</td>
                    <td className="p-3 font-mono text-[11px] text-stone-800">{book.barcode}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onCheckoutBook(book)}
                        disabled={!isAvailable}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          isAvailable
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        Checkout
                      </button>
                      <button
                        onClick={() => onPrintLabel(book)}
                        className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                        title="Print Barcode Label"
                      >
                        <QrCode className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => onDeleteBook(book.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
