/**
 * LoDrum Maker - Master Virtual Instrument & Pattern Creator
 * The Plugin Foundry
 * Architecture: Hybrid DSP Synthesis Engine · 16/32-Step Sequencer · Algorithmic Generator · MIDI/Audio/C++ Export
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Preset, SynthParameters, MacroParameters, SequencerPattern, SequencerStep } from './audio/types';
import { LoDrumEngine } from './audio/LoDrumEngine';
import { SequencerEngine } from './sequencer/SequencerEngine';
import { FACTORY_PRESETS } from './presets/factoryPresets';
import { TopBar } from './components/TopBar';
import { MacroPanel } from './components/MacroPanel';
import { Visualizer } from './components/Visualizer';
import { SoundDesignPanel } from './components/SoundDesignPanel';
import { PatternSequencer } from './components/PatternSequencer';
import { PerformView } from './components/PerformView';
import { PresetBrowser } from './components/PresetBrowser';
import { ExportModal } from './components/ExportModal';
import { CppSourceViewerModal } from './components/CppSourceViewerModal';
import { Volume2, Play, Pause, Layers, Sliders, Music, Download, Code } from 'lucide-react';

export default function App() {
  const engine = LoDrumEngine.getInstance();
  const sequencer = SequencerEngine.getInstance();

  const [activeTab, setActiveTab] = useState<ActiveTab>('sound');
  const [currentPreset, setCurrentPreset] = useState<Preset>(FACTORY_PRESETS[7]); // Default: Amapiano Bounce
  const [synthParams, setSynthParams] = useState<SynthParameters>(engine.getParameters());
  const [macros, setMacros] = useState<MacroParameters>(engine.getMacros());

  // Sequencer state
  const [pattern, setPattern] = useState<SequencerPattern>(sequencer.getPattern());
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modals
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCppViewerOpen, setIsCppViewerOpen] = useState(false);

  // Initialize preset
  useEffect(() => {
    applyPreset(FACTORY_PRESETS[7]); // Amapiano Bounce
  }, []);

  // Sequencer listeners
  useEffect(() => {
    sequencer.onStep((step) => {
      setCurrentStep(step);
    });
    sequencer.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });
  }, []);

  const applyPreset = (preset: Preset) => {
    setCurrentPreset(preset);
    setMacros(preset.macros);
    setSynthParams(preset.synth);

    // Apply to real DSP engine
    engine.setAllMacros(preset.macros);
    (Object.keys(preset.synth) as (keyof SynthParameters)[]).forEach((key) => {
      engine.setParameter(key, preset.synth[key]);
    });
  };

  const handleMacroChange = (key: keyof MacroParameters, val: number) => {
    engine.setMacro(key, val);
    setMacros(engine.getMacros());
    setSynthParams(engine.getParameters());
  };

  const handleParamChange = <K extends keyof SynthParameters>(key: K, val: SynthParameters[K]) => {
    engine.setParameter(key, val);
    setSynthParams(engine.getParameters());
  };

  const handlePatternChange = (newPat: SequencerPattern) => {
    setPattern(newPat);
    sequencer.setPattern(newPat);
  };

  const handleStepUpdate = (index: number, stepPartial: Partial<SequencerStep>) => {
    sequencer.updateStep(index, stepPartial);
    setPattern({ ...sequencer.getPattern() });
  };

  const handleAudition = (note: number = 36) => {
    engine.triggerNote(note, 110);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] flex flex-col font-sans selection:bg-amber-500/30">
      {/* 1. Universal Top Bar */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentPreset={currentPreset}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenCppViewer={() => setIsCppViewerOpen(true)}
      />

      {/* 2. Main Studio Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-5 flex flex-col gap-5">
        {/* Top Control Block: Macro Command Strip & Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Real-Time Visualizer (Left 4 cols on wide screens) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <Visualizer params={synthParams} macros={macros} />

            {/* Quick Audition & Preset Preview Strip */}
            <div className="mt-3 p-3 bg-[#11131a] border border-[#212532] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAudition(36)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Audition Low C1 Log Drum"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audition C1</span>
                </button>
                <button
                  onClick={() => handleAudition(48)}
                  className="px-3 py-1.5 bg-[#181d29] hover:bg-[#222838] text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-[#252b3c] active:scale-95"
                  title="Audition High C2 Log Drum"
                >
                  Audition C2
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <button
                    onClick={() => sequencer.pause()}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-neutral-950 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Pause className="w-3 h-3 fill-current" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => sequencer.play()}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500 text-neutral-950 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Loop</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 10 Macro Rotary Strip (Right 8 cols) */}
          <div className="lg:col-span-8">
            <MacroPanel macros={macros} onMacroChange={handleMacroChange} />
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#1f2433] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sound')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'sound'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-[#12151e] text-neutral-400 hover:text-white border border-[#202534]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Mode A — SOUND</span>
            </button>

            <button
              onClick={() => setActiveTab('pattern')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'pattern'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-[#12151e] text-neutral-400 hover:text-white border border-[#202534]'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Mode B — PATTERN</span>
            </button>

            <button
              onClick={() => setActiveTab('perform')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'perform'
                  ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                  : 'bg-[#12151e] text-neutral-400 hover:text-white border border-[#202534]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mode C — PERFORM</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span>Current Style:</span>
            <span className="font-semibold text-amber-400 font-mono">
              {currentPreset.category} · {pattern.bpm} BPM
            </span>
          </div>
        </div>

        {/* Tab View Container */}
        <div className="flex-1">
          {activeTab === 'sound' && (
            <SoundDesignPanel params={synthParams} onParamChange={handleParamChange} />
          )}

          {activeTab === 'pattern' && (
            <PatternSequencer
              pattern={pattern}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onPlay={() => sequencer.play()}
              onPause={() => sequencer.pause()}
              onStop={() => sequencer.stop()}
              onPatternChange={handlePatternChange}
              onStepUpdate={handleStepUpdate}
            />
          )}

          {activeTab === 'perform' && (
            <PerformView glideTime={synthParams.glideTime} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1a1e29] px-6 py-3.5 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-neutral-300">LoDrum Maker</span>
          <span>·</span>
          <span>The Plugin Foundry</span>
          <span>·</span>
          <span>VST3 · AU · Modern C++20 · Web Audio DSP</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCppViewerOpen(true)}
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>C++ Source Files</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Center</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      {isPresetsOpen && (
        <PresetBrowser
          currentPreset={currentPreset}
          currentMacros={macros}
          currentSynth={synthParams}
          onSelectPreset={applyPreset}
          onClose={() => setIsPresetsOpen(false)}
        />
      )}

      {isExportOpen && (
        <ExportModal
          pattern={pattern}
          synth={synthParams}
          macros={macros}
          onClose={() => setIsExportOpen(false)}
          onOpenCppViewer={() => {
            setIsExportOpen(false);
            setIsCppViewerOpen(true);
          }}
        />
      )}

      {isCppViewerOpen && (
        <CppSourceViewerModal onClose={() => setIsCppViewerOpen(false)} />
      )}
    </div>
  );
}
