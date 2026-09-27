import React from 'react';
import { X, BookOpen, MapPin, Printer, CheckCircle2, XCircle, Tag, Globe } from 'lucide-react';
import { Book, Region } from '../types';
import { BarcodeSVG, QRCodeSVG } from '../utils/barcodeGenerator';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  regions: Region[];
  onCheckout: (book: Book) => void;
  onPrintLabel: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  regions,
  onCheckout,
  onPrintLabel,
}) => {
  if (!book) return null;

  const region = regions.find((r) => r.id === book.regionId);
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-stone-100 p-6 flex items-start justify-between border-b border-stone-800">
          <div className="space-y-1 pr-4">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-amber-500/30">
              {book.accessionNumber}
            </span>
            <h2 className="font-serif text-2xl font-bold text-white mt-1">{book.title}</h2>
            <p className="text-stone-300 text-sm font-medium">By {book.author}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status & Region Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-700" />
              <div>
                <div className="text-xs font-bold text-stone-900">{region?.name || 'Regional Library'}</div>
                <div className="text-[11px] text-stone-500 font-mono">Code: {region?.code || 'GEN'}</div>
              </div>
            </div>

            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isAvailable
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Available ({book.availableCopies}/{book.totalCopies} Copies)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>All {book.totalCopies} Copies Borrowed</span>
                </>
              )}
            </span>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Category:</span>
              <p className="font-semibold text-stone-900">{book.category}</p>
            </div>
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Shelf Location:</span>
              <p className="font-semibold text-stone-900">{book.shelfLocation}</p>
            </div>
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">Language:</span>
              <p className="font-semibold text-stone-900">{book.language}</p>
            </div>
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <span className="text-stone-500 font-medium">ISBN Number:</span>
              <p className="font-mono font-semibold text-stone-900">{book.isbn || 'N/A'}</p>
            </div>
            {book.publisher && (
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium">Publisher:</span>
                <p className="font-semibold text-stone-900">
                  {book.publisher} {book.publishYear ? `(${book.publishYear})` : ''}
                </p>
              </div>
            )}
            {book.translator && (
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium">Translator:</span>
                <p className="font-semibold text-stone-900">{book.translator}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Overview / Description
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                {book.description}
              </p>
            </div>
          )}

          {/* Barcode & Label Box */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <QRCodeSVG value={book.barcode} size={70} />
              <div>
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Inventory Barcode
                </span>
                <p className="font-mono text-sm font-bold text-stone-900">{book.barcode}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Scannable for fast inventory & checkout</p>
              </div>
            </div>

            <button
              onClick={() => onPrintLabel(book)}
              className="flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Barcode Label</span>
            </button>
          </div>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-400" />
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-stone-100 text-stone-600 text-[11px] px-2 py-0.5 rounded border border-stone-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onCheckout(book);
            }}
            disabled={!isAvailable}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white shadow transition-colors ${
              isAvailable ? 'bg-amber-600 hover:bg-amber-700' : 'bg-stone-300 cursor-not-allowed'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Issue Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
