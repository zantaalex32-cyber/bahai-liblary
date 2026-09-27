import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Barcode, Tag, MapPin, RefreshCw } from 'lucide-react';
import { Book, BookCategory, Region } from '../types';
import { apiService } from '../services/apiService';
import { BarcodeSVG } from '../utils/barcodeGenerator';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: Region[];
  onSaveBook: (bookData: Partial<Book>) => Promise<void>;
  editBook?: Book | null;
}

const CATEGORIES: BookCategory[] = [
  'Sacred Writings',
  'Baha\'i History',
  'Introductory & Principles',
  'Administration & Covenant',
  'Youth & Children',
  'Devotional & Prayers',
  'Deepening & Study',
  'Biographies & Memoirs',
];

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  regions,
  onSaveBook,
  editBook,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(editBook?.title || '');
  const [author, setAuthor] = useState(editBook?.author || '');
  const [translator, setTranslator] = useState(editBook?.translator || '');
  const [category, setCategory] = useState<BookCategory>(editBook?.category || 'Sacred Writings');
  const [regionId, setRegionId] = useState(editBook?.regionId || regions[0]?.id || 'reg-na');
  const [shelfLocation, setShelfLocation] = useState(editBook?.shelfLocation || 'Shelf A-1');
  const [totalCopies, setTotalCopies] = useState(editBook?.totalCopies || 1);
  const [language, setLanguage] = useState(editBook?.language || 'English');
  const [publisher, setPublisher] = useState(editBook?.publisher || '');
  const [publishYear, setPublishYear] = useState(editBook?.publishYear || new Date().getFullYear());
  const [isbn, setIsbn] = useState(editBook?.isbn || '');
  const [barcode, setBarcode] = useState(
    editBook?.barcode || `978${Math.floor(1000000000 + Math.random() * 9000000000)}`
  );
  const [description, setDescription] = useState(editBook?.description || '');
  const [tagsInput, setTagsInput] = useState(editBook?.tags ? editBook.tags.join(', ') : '');

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRegion = regions.find((r) => r.id === regionId) || regions[0];

  const handleGenerateBarcode = () => {
    const regCode = selectedRegion ? selectedRegion.code : 'GEN';
    const randDigits = Math.floor(10000000 + Math.random() * 90000000);
    setBarcode(`${regCode}${randDigits}`);
  };

  const handleAiAutoFill = async () => {
    if (!title.trim()) {
      setAiError('Please enter a book title first to auto-fill details.');
      return;
    }
    setIsAiLoading(true);
    setAiError(null);
    try {
      const metadata = await apiService.autoCatalogWithGemini(title, author);
      if (metadata.description) setDescription(metadata.description);
      if (metadata.category && CATEGORIES.includes(metadata.category)) {
        setCategory(metadata.category);
      }
      if (metadata.language) setLanguage(metadata.language);
      if (Array.isArray(metadata.tags)) {
        setTagsInput(metadata.tags.join(', '));
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to auto-catalog with AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSaveBook({
        title: title.trim(),
        author: author.trim(),
        translator: translator.trim(),
        category,
        regionId,
        shelfLocation: shelfLocation.trim(),
        totalCopies: Number(totalCopies),
        language: language.trim(),
        publisher: publisher.trim(),
        publishYear: Number(publishYear),
        isbn: isbn.trim(),
        barcode,
        description: description.trim(),
        tags,
      });

      onClose();
    } catch (err) {
      console.error('Error saving book:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">
                {editBook ? 'Edit Book Record' : 'Add Book to BLibrary Inventory'}
              </h3>
              <p className="text-xs text-stone-400">Region-based accession and automated barcode assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title & AI Assist */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Book Title *
              </label>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAiLoading}
                className="flex items-center space-x-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>✨ Auto-Fill with Gemini AI</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. The Kitáb-i-Aqdas, Some Answered Questions, Paris Talks..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              id="book-title-input"
            />
            {aiError && <p className="text-xs text-rose-600 font-medium mt-1">{aiError}</p>}
          </div>

          {/* Author & Translator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Author *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bahá'u'lláh, 'Abdu'l-Bahá, Shoghi Effendi..."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                id="book-author-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Translator / Compiler
              </label>
              <input
                type="text"
                placeholder="e.g. Shoghi Effendi, Marzieh Gail..."
                value={translator}
                onChange={(e) => setTranslator(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Region & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Library Region *
              </label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                id="book-region-select"
              >
                {regions.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    [{reg.code}] {reg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                id="book-category-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barcode & Copies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="sm:col-span-2 space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Barcode Value
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-amber-700 hover:underline font-semibold"
                >
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full font-mono text-xs bg-white border border-stone-300 text-stone-900 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              />
              <div className="pt-2 flex justify-center">
                <BarcodeSVG value={barcode} width={180} height={45} showValueText={false} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Total Copies
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={totalCopies}
                onChange={(e) => setTotalCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-stone-500">Number of physical inventory copies</p>
            </div>
          </div>

          {/* Shelf Location, Language, ISBN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Shelf Location
              </label>
              <input
                type="text"
                placeholder="e.g. Shelf A-2, Cabinet 1"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Language
              </label>
              <input
                type="text"
                placeholder="English, Spanish, Swahili..."
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                ISBN Number
              </label>
              <input
                type="text"
                placeholder="978-087743..."
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 font-mono text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Description / Overview
            </label>
            <textarea
              rows={3}
              placeholder="Summary of contents, historical background, or study guidance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Search Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="Laws, Sacred Text, History, Youth..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg p-2.5"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow transition-colors"
              id="save-book-submit-btn"
            >
              {isSubmitting ? 'Saving Record...' : editBook ? 'Update Book' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
