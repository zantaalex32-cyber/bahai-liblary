import React, { useState } from 'react';
import { Printer, Download, QrCode, Tag, Check, Grid, Settings } from 'lucide-react';
import { Book, PrintableLabelConfig, Region } from '../types';
import { BarcodeSVG, QRCodeSVG } from '../utils/barcodeGenerator';

interface LabelPrinterStudioProps {
  books: Book[];
  regions: Region[];
  selectedRegionId: string;
  preselectedBookForPrint?: Book | null;
}

export const LabelPrinterStudio: React.FC<LabelPrinterStudioProps> = ({
  books,
  regions,
  selectedRegionId,
  preselectedBookForPrint,
}) => {
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(
    preselectedBookForPrint ? [preselectedBookForPrint.id] : books.slice(0, 6).map((b) => b.id)
  );

  const [labelConfig, setLabelConfig] = useState<PrintableLabelConfig>({
    labelWidthMm: 70,
    labelHeightMm: 36,
    includeQrCode: true,
    includeTitle: true,
    includeAuthor: true,
    includeRegion: true,
    includeShelf: true,
    fontSize: 'medium',
    layoutColumns: 3,
  });

  const filteredBooks = books.filter((b) =>
    selectedRegionId === 'ALL' ? true : b.regionId === selectedRegionId
  );

  const selectedBooks = books.filter((b) => selectedBookIds.includes(b.id));

  const toggleBookSelection = (id: string) => {
    if (selectedBookIds.includes(id)) {
      setSelectedBookIds(selectedBookIds.filter((bId) => bId !== id));
    } else {
      setSelectedBookIds([...selectedBookIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedBookIds(filteredBooks.map((b) => b.id));
  };

  const deselectAll = () => {
    setSelectedBookIds([]);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const getRegionCode = (regionId: string) => {
    const reg = regions.find((r) => r.id === regionId);
    return reg ? reg.code : 'GEN';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Printable CSS Rules Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label-sheet, #printable-label-sheet * {
            visibility: visible;
          }
          #printable-label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-6 text-stone-100 shadow-xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold tracking-wide">
            INVENTORY LABEL CENTER
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
            Barcode Label Printer & Layout Studio
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-xl">
            Design and print physical adhesive barcode labels for book spines, shelf inventory tags, and accession cataloging.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerPrint}
            disabled={selectedBooks.length === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-colors ${
              selectedBooks.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
            id="print-labels-action-btn"
          >
            <Printer className="w-4 h-4" />
            <span>Print {selectedBooks.length} Selected Labels</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left Options & Selectors */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Settings className="w-4 h-4 text-amber-700" />
            <h3 className="font-serif font-bold text-stone-900 text-base">Label Config & Grid</h3>
          </div>

          {/* Grid Layout choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 uppercase">Sheet Columns</label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setLabelConfig({ ...labelConfig, layoutColumns: cols })}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    labelConfig.layoutColumns === cols
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cols} Columns
                </button>
              ))}
            </div>
          </div>

          {/* Label Toggles */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="text-xs font-bold text-stone-800 uppercase block mb-1">
              Include Label Fields
            </label>

            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={labelConfig.includeTitle}
                onChange={(e) => setLabelConfig({ ...labelConfig, includeTitle: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Book Title</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={labelConfig.includeAuthor}
                onChange={(e) => setLabelConfig({ ...labelConfig, includeAuthor: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Author Name</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={labelConfig.includeQrCode}
                onChange={(e) => setLabelConfig({ ...labelConfig, includeQrCode: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>QR Code (Quick Phone Scan)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={labelConfig.includeRegion}
                onChange={(e) => setLabelConfig({ ...labelConfig, includeRegion: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Region Code</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={labelConfig.includeShelf}
                onChange={(e) => setLabelConfig({ ...labelConfig, includeShelf: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Shelf Location</span>
            </label>
          </div>

          {/* Book Selection Queue */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 uppercase">
                Select Books ({selectedBookIds.length}/{filteredBooks.length})
              </label>
              <div className="space-x-2 text-[11px]">
                <button onClick={selectAll} className="text-amber-800 hover:underline font-semibold">
                  Select All
                </button>
                <button onClick={deselectAll} className="text-stone-500 hover:underline">
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredBooks.map((b) => {
                const isSelected = selectedBookIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBookSelection(b.id)}
                    className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition-colors ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 text-stone-900 font-semibold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div>{b.title}</div>
                      <div className="text-[10px] font-mono text-stone-400">{b.accessionNumber}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-700 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Printable Preview Sheet */}
        <div className="lg:col-span-8 bg-stone-100 rounded-xl border border-stone-300 p-6 shadow-inner space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-serif font-bold text-stone-900 text-sm">
              Printable Sheet Preview ({selectedBooks.length} Label Cards)
            </span>
            <span className="font-mono text-[11px] text-stone-500">A4 / Sticker Sheet Ready</span>
          </div>

          {selectedBooks.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-stone-200 text-stone-500 text-xs">
              No books selected for barcode printing.
            </div>
          ) : (
            <div
              id="printable-label-sheet"
              className={`grid gap-4 bg-white p-6 rounded-xl border border-stone-300 shadow-md ${
                labelConfig.layoutColumns === 2
                  ? 'grid-cols-2'
                  : labelConfig.layoutColumns === 4
                  ? 'grid-cols-4'
                  : 'grid-cols-3'
              }`}
            >
              {selectedBooks.map((book) => {
                const regCode = getRegionCode(book.regionId);

                return (
                  <div
                    key={book.id}
                    className="p-3 border-2 border-dashed border-stone-300 rounded-lg bg-white flex flex-col justify-between space-y-2 select-none"
                    style={{ minHeight: '140px' }}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-stone-900 border-b border-stone-200 pb-1">
                      <span>BLibrary</span>
                      {labelConfig.includeRegion && (
                        <span className="bg-stone-100 px-1 rounded">{regCode}</span>
                      )}
                      <span>{book.accessionNumber}</span>
                    </div>

                    {/* Book Metadata */}
                    <div>
                      {labelConfig.includeTitle && (
                        <div className="font-serif font-bold text-xs text-stone-900 line-clamp-1 leading-tight">
                          {book.title}
                        </div>
                      )}
                      {labelConfig.includeAuthor && (
                        <div className="text-[10px] text-stone-600 truncate">{book.author}</div>
                      )}
                      {labelConfig.includeShelf && (
                        <div className="text-[9px] text-stone-500 font-mono mt-0.5">
                          Shelf: {book.shelfLocation}
                        </div>
                      )}
                    </div>

                    {/* Barcode / QR rendering */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex-1">
                        <BarcodeSVG value={book.barcode} height={32} showValueText={true} />
                      </div>
                      {labelConfig.includeQrCode && (
                        <div className="ml-1 shrink-0">
                          <QRCodeSVG value={book.barcode} size={42} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
