import React from 'react';
import {
  BookOpen,
  Users,
  Clock,
  Mail,
  Printer,
  QrCode,
  Plus,
  RefreshCw,
  Globe,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Region, SyncState } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'borrowers' | 'loans' | 'reminders' | 'labels';
  setActiveTab: (tab: 'catalog' | 'borrowers' | 'loans' | 'reminders' | 'labels') => void;
  regions: Region[];
  selectedRegionId: string;
  setSelectedRegionId: (id: string) => void;
  overdueCount: number;
  syncState: SyncState;
  onOpenScanner: () => void;
  onOpenAddBook: () => void;
  onOpenRegionManager: () => void;
  onTriggerSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  regions,
  selectedRegionId,
  setSelectedRegionId,
  overdueCount,
  syncState,
  onOpenScanner,
  onOpenAddBook,
  onOpenRegionManager,
  onTriggerSync,
}) => {
  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-900/20">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-xl font-bold tracking-tight text-amber-100">
                  Bahai Library
                </h1>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  BLibrary
                </span>
              </div>
              <p className="text-xs text-stone-400 font-sans hidden sm:block">
                Multi-Region Catalog & Automated Borrowers System
              </p>
            </div>
          </div>

          {/* Region Switcher & Sync Status */}
          <div className="flex items-center space-x-3">
            {/* Region Dropdown */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedRegionId}
                onChange={(e) => setSelectedRegionId(e.target.value)}
                className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg pl-9 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                id="region-select-dropdown"
              >
                <option value="ALL">All Regions (Global View)</option>
                {regions.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    [{reg.code}] {reg.name}
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenRegionManager}
                title="Manage Regions"
                className="ml-1 p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors"
                id="manage-regions-btn"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>

            {/* Sync Status Badge */}
            <button
              onClick={onTriggerSync}
              disabled={syncState.isSyncing}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                syncState.isOnline
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/50 hover:bg-amber-900/50'
              }`}
              title={syncState.isOnline ? 'Connected & Synced' : 'Offline Mode (Local Sync Active)'}
              id="sync-status-btn"
            >
              {syncState.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : syncState.isOnline ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline font-mono">
                {syncState.isSyncing ? 'Syncing...' : syncState.isOnline ? 'Online Sync' : 'Offline Storage'}
              </span>
            </button>

            {/* Quick Actions */}
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1.5 rounded-lg text-xs shadow transition-colors"
              id="scan-barcode-header-btn"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            <button
              onClick={onOpenAddBook}
              className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow transition-colors"
              id="add-book-header-btn"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Book</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-stone-800/80 no-scrollbar">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            id="tab-catalog"
          >
            <BookOpen className="w-4 h-4" />
            <span>Book Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('borrowers')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'borrowers'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            id="tab-borrowers"
          >
            <Users className="w-4 h-4" />
            <span>Borrowers & Members</span>
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'loans'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            id="tab-loans"
          >
            <Clock className="w-4 h-4" />
            <span>Loans & Returns</span>
            {overdueCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            id="tab-reminders"
          >
            <Mail className="w-4 h-4" />
            <span>Overdue Email Reminders</span>
            {overdueCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('labels')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'labels'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            id="tab-labels"
          >
            <Printer className="w-4 h-4" />
            <span>Barcode & Label Center</span>
          </button>
        </div>
      </div>
    </header>
  );
};
