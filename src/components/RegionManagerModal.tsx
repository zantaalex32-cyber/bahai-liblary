import React, { useState } from 'react';
import { X, Globe, Plus, MapPin, Mail, CheckCircle2 } from 'lucide-react';
import { Region } from '../types';

interface RegionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: Region[];
  onAddRegion: (regionData: { code: string; name: string; location: string; contactEmail: string }) => Promise<void>;
}

export const RegionManagerModal: React.FC<RegionManagerModalProps> = ({
  isOpen,
  onClose,
  regions,
  onAddRegion,
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddRegion({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        location: location.trim(),
        contactEmail: contactEmail.trim(),
      });
      setCode('');
      setName('');
      setLocation('');
      setContactEmail('');
    } catch (err) {
      console.error('Error adding region:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg">Multi-Regional Library Branches</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of existing regions */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
              Configured Library Regions ({regions.length})
            </label>
            <div className="space-y-2">
              {regions.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-900">
                      [{reg.code}] {reg.name}
                    </div>
                    <div className="text-stone-500 text-[11px] font-mono">{reg.location}</div>
                  </div>
                  <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300">
                    BL-{reg.code}-XXXX
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Region Form */}
          <form onSubmit={handleSubmit} className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-amber-700" />
              <span>Add New Regional Library Branch</span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700 uppercase">Code (e.g. NA) *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="e.g. EA"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-stone-300 text-stone-900 text-xs font-mono font-bold rounded-lg p-2"
                  id="region-code-input"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-stone-700 uppercase">Region Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. East Africa Regional Library"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-stone-300 text-stone-900 text-xs rounded-lg p-2"
                  id="region-name-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700 uppercase">City / Location</label>
                <input
                  type="text"
                  placeholder="Kampala, Uganda"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border border-stone-300 text-stone-900 text-xs rounded-lg p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700 uppercase">Contact Email</label>
                <input
                  type="email"
                  placeholder="library@bahai.or.ug"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-white border border-stone-300 text-stone-900 text-xs rounded-lg p-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg shadow transition-colors"
            >
              {isSubmitting ? 'Creating Region...' : 'Register Region Branch'}
            </button>
          </form>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
