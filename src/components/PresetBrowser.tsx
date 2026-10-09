/**
 * LoDrum Maker - Preset Browser & Sound Library
 * The Plugin Foundry | Section 10
 */

import React, { useState } from 'react';
import { Preset, MacroParameters, SynthParameters } from '../audio/types';
import { PresetManager } from '../presets/presetManager';
import { FolderDown, FolderUp, Plus, Trash2, Check, Music } from 'lucide-react';

interface PresetBrowserProps {
  currentPreset: Preset;
  currentMacros: MacroParameters;
  currentSynth: SynthParameters;
  onSelectPreset: (preset: Preset) => void;
  onClose: () => void;
}

export const PresetBrowser: React.FC<PresetBrowserProps> = ({
  currentPreset,
  currentMacros,
  currentSynth,
  onSelectPreset,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<Preset['category']>('Amapiano');
  const [userPresets, setUserPresets] = useState<Preset[]>(PresetManager.getUserPresets());

  const allPresets = [...PresetManager.getFactoryPresets(), ...userPresets];

  const categories = ['All', 'Amapiano', 'Gqom', 'Sub', 'Distorted', 'Percussive', 'Experimental', 'User'];

  const filteredPresets = allPresets.filter(p => {
    const isUser = p.id.startsWith('user_');
    const matchesCat = 
      selectedCategory === 'All' 
        ? true 
        : selectedCategory === 'User' 
        ? isUser 
        : p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSaveUserPreset = () => {
    if (!newPresetName.trim()) return;

    const userPreset: Preset = {
      id: `user_${Date.now()}`,
      name: newPresetName.trim(),
      category: newPresetCategory,
      description: 'Custom user log drum sound design.',
      macros: { ...currentMacros },
      synth: { ...currentSynth }
    };

    PresetManager.saveUserPreset(userPreset);
    setUserPresets(PresetManager.getUserPresets());
    onSelectPreset(userPreset);
    setIsSavingNew(false);
    setNewPresetName('');
  };

  const handleDeleteUserPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    PresetManager.deleteUserPreset(id);
    setUserPresets(PresetManager.getUserPresets());
  };

  const handleExportJson = (preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    PresetManager.exportPresetAsJson(preset);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = PresetManager.importPresetFromJson(content);
      if (imported) {
        setUserPresets(PresetManager.getUserPresets());
        onSelectPreset(imported);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#11131a] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2330]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              LoDrum Preset Library
            </h2>
            <p className="text-xs text-neutral-400">
              12 Authentic Factory Presets & Custom Sound Designs
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-[#181c26] hover:bg-[#202534] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-[#1e2330] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search presets by character, name, or feel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-[#0c0e14] text-xs text-neutral-200 px-3 py-2 rounded-lg border border-[#202534] focus:outline-none focus:border-amber-500/50"
            />

            <button
              onClick={() => setIsSavingNew(!isSavingNew)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current Sound</span>
            </button>

            {/* Import JSON button */}
            <label className="flex items-center gap-1.5 px-3 py-2 bg-[#191d29] hover:bg-[#222737] text-neutral-200 text-xs rounded-lg transition-colors cursor-pointer border border-[#252b3c] whitespace-nowrap">
              <FolderUp className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".lodrum,.json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-[#151822] text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Inline Save Form */}
          {isSavingNew && (
            <div className="p-3 bg-[#0c0e14] rounded-xl border border-amber-500/40 flex flex-wrap items-center gap-2 animate-in fade-in">
              <input
                type="text"
                placeholder="New Preset Name..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 bg-[#151822] text-xs text-white px-3 py-1.5 rounded-lg border border-[#242938] focus:outline-none"
              />
              <select
                value={newPresetCategory}
                onChange={(e) => setNewPresetCategory(e.target.value as any)}
                className="bg-[#151822] text-xs text-neutral-300 px-2 py-1.5 rounded-lg border border-[#242938]"
              >
                <option value="Amapiano">Amapiano</option>
                <option value="Gqom">Gqom</option>
                <option value="Sub">Sub</option>
                <option value="Distorted">Distorted</option>
                <option value="Percussive">Percussive</option>
                <option value="Experimental">Experimental</option>
              </select>
              <button
                onClick={handleSaveUserPreset}
                className="px-3 py-1.5 bg-amber-500 text-neutral-950 font-bold text-xs rounded-lg hover:bg-amber-400"
              >
                Save
              </button>
              <button
                onClick={() => setIsSavingNew(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Preset List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
          {filteredPresets.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No presets found matching your filter.
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const isSelected = currentPreset.id === preset.id;
              const isUser = preset.id.startsWith('user_');

              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#181d29] border-amber-500 shadow-md'
                      : 'bg-[#13161f] border-[#1f2432] hover:bg-[#191c27]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-[#0e1017] text-amber-500">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          · {preset.category}
                        </span>
                        {isUser && (
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">
                            User
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Export JSON */}
                    <button
                      onClick={(e) => handleExportJson(preset, e)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Export Preset (.lodrum)"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete if user */}
                    {isUser && (
                      <button
                        onClick={(e) => handleDeleteUserPreset(preset.id, e)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete User Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
