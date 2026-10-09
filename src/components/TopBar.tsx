/**
 * LoDrum Maker - Top Bar
 * The Plugin Foundry
 * Follows Universal Frontend Design Constitution Top Bar Contract
 */

import React from 'react';
import { ActiveTab, Preset } from '../audio/types';
import { Download } from 'lucide-react';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentPreset: Preset;
  onOpenPresets: () => void;
  onOpenExport: () => void;
  onOpenCppViewer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  currentPreset,
  onOpenPresets,
  onOpenExport,
  onOpenCppViewer
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0e1017] border-b border-[#1e2330] select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); onTabChange('sound'); }}
          className="text-base font-extrabold tracking-tight text-white whitespace-nowrap flex items-center gap-2 group"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 group-hover:bg-amber-400 transition-colors" />
          <span>LoDrum Maker</span>
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links / interactive mode selectors */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
        <button
          onClick={() => onTabChange('sound')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'sound' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          Sound Design
        </button>

        <button
          onClick={() => onTabChange('pattern')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'pattern' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          Pattern Creator
        </button>

        <button
          onClick={() => onTabChange('perform')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'perform' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          Live Performance
        </button>

        <button
          onClick={onOpenPresets}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-neutral-300"
        >
          <span>Preset:</span>
          <span className="text-amber-400 underline decoration-amber-500/40 underline-offset-4">{currentPreset.name}</span>
        </button>

        <button
          onClick={onOpenCppViewer}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-neutral-400"
        >
          C++ VST3 Code
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export MIDI & Audio</span>
        </button>
      </div>
    </header>
  );
};
