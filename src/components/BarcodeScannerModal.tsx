import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, QrCode, Search, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Book, Borrower } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  borrowers: Borrower[];
  onSelectBookForDetails: (book: Book) => void;
  onQuickCheckout: (book: Book) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  books,
  borrowers,
  onSelectBookForDetails,
  onQuickCheckout,
}) => {
  if (!isOpen) return null;

  const [scanMode, setScanMode] = useState<'camera' | 'usb' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedBook, setMatchedBook] = useState<Book | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const usbBufferRef = useRef('');

  // Handle barcode match lookup
  const lookupBarcode = (code: string) => {
    const clean = code.trim().toLowerCase();
    setScannedCode(code.trim());

    const found = books.find(
      (b) =>
        b.barcode.toLowerCase() === clean ||
        b.accessionNumber.toLowerCase() === clean ||
        b.isbn?.toLowerCase() === clean
    );

    setMatchedBook(found || null);
  };

  // Hardware USB Barcode Scanner keypress listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if user is typing inside an input field
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (usbBufferRef.current.length > 2) {
          lookupBarcode(usbBufferRef.current);
          usbBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        usbBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [books]);

  // Camera scanner setup
  useEffect(() => {
    if (scanMode === 'camera' && isOpen) {
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            'reader-camera-container',
            {
              fps: 10,
              qrbox: { width: 250, height: 180 },
              aspectRatio: 1.0,
            },
            false
          );

          scanner.render(
            (decodedText) => {
              lookupBarcode(decodedText);
              scanner.clear();
            },
            (errorMessage) => {
              // Ignore standard frame scan errors
            }
          );
          scannerRef.current = scanner;
        } catch (err: any) {
          console.error('Camera scanner init error:', err);
          setCameraError('Camera access not supported or permission denied.');
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [scanMode, isOpen]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      lookupBarcode(manualInput);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">Barcode Inventory Scanner</h3>
              <p className="text-xs text-stone-400">Camera, USB scanner, and accession lookup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Mode Switcher */}
        <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-center space-x-2">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scanMode === 'camera'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>

          <button
            onClick={() => setScanMode('usb')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scanMode === 'usb'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>USB Hardware Scanner</span>
          </button>

          <button
            onClick={() => setScanMode('manual')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scanMode === 'manual'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Manual Input</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {scanMode === 'camera' && (
            <div className="space-y-3">
              <div id="reader-camera-container" className="rounded-xl overflow-hidden border border-stone-300 min-h-[220px]" />
              {cameraError && (
                <p className="text-xs text-rose-600 font-medium text-center">{cameraError}</p>
              )}
            </div>
          )}

          {scanMode === 'usb' && (
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center space-y-3">
              <QrCode className="w-10 h-10 text-amber-700 mx-auto animate-bounce" />
              <h4 className="font-bold text-amber-950 text-sm">USB Scanner Ready</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Scan any book barcode label using your handheld hardware USB scanner. The system will automatically trigger instant inventory lookup.
              </p>
            </div>
          )}

          {scanMode === 'manual' && (
            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="text-xs font-bold text-stone-800 uppercase">
                Enter Barcode / Accession Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. 9780877432001 or BL-NA-1001"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-amber-500"
                  id="barcode-manual-input"
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow"
                >
                  Lookup
                </button>
              </div>
            </form>
          )}

          {/* Result Match Box */}
          {scannedCode && (
            <div className="border-t border-stone-200 pt-4 space-y-3">
              <div className="text-xs font-mono font-bold text-stone-500">
                Scanned Value: <span className="text-stone-900">{scannedCode}</span>
              </div>

              {matchedBook ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>MATCH FOUND IN CATALOG</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      {matchedBook.accessionNumber}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-stone-900 text-base">
                      {matchedBook.title}
                    </h4>
                    <p className="text-xs text-stone-600">By {matchedBook.author}</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Shelf: {matchedBook.shelfLocation} | Available Copies: {matchedBook.availableCopies}/{matchedBook.totalCopies}
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-emerald-200">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectBookForDetails(matchedBook);
                      }}
                      className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-2 rounded-lg"
                    >
                      View Full Details
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onQuickCheckout(matchedBook);
                      }}
                      disabled={matchedBook.availableCopies <= 0}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg ${
                        matchedBook.availableCopies > 0
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      Quick Checkout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center text-xs space-y-1">
                  <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
                  <p className="font-bold text-rose-900">No book record matched this barcode.</p>
                  <p className="text-rose-700">
                    You can add a new book to the inventory with this barcode value.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg hover:bg-stone-300"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
