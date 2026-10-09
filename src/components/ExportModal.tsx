/**
 * LoDrum Maker - Export Workstation (MIDI, 24-Bit WAV & JUCE C++ VST3 Project)
 * The Plugin Foundry | Section 8
 */

import React, { useState } from 'react';
import { SequencerPattern, SynthParameters, MacroParameters } from '../audio/types';
import { MidiExporter } from '../audio/MidiExport';
import { AudioExporter } from '../audio/AudioExport';
import { CppSourceArchive } from '../export_vst3/cppSourceArchive';
import { Download, FileAudio, FileCode, CheckCircle, Loader2 } from 'lucide-react';

interface ExportModalProps {
  pattern: SequencerPattern;
  synth: SynthParameters;
  macros: MacroParameters;
  onClose: () => void;
  onOpenCppViewer: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  pattern,
  synth,
  macros,
  onClose,
  onOpenCppViewer
}) => {
  const [isRenderingAudio, setIsRenderingAudio] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleMidiExport = () => {
    MidiExporter.downloadPatternMidi(pattern);
    setDownloadSuccess('Standard MIDI File (.mid) downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleAudioExport = async (type: 'pattern' | 'oneshot') => {
    setIsRenderingAudio(true);
    try {
      if (type === 'pattern') {
        await AudioExporter.downloadPatternWav(pattern, synth, macros);
        setDownloadSuccess('24-Bit WAV Pattern stem exported.');
      } else {
        // One-shot pattern with single step
        const oneShotPattern: SequencerPattern = {
          ...pattern,
          length: 4,
          steps: [{
            active: true,
            note: 36,
            velocity: 115,
            accent: true,
            slide: false,
            probability: 1.0
          }]
        };
        await AudioExporter.downloadPatternWav(oneShotPattern, synth, macros, `LoDrum_OneShot_C1_24bit.wav`);
        setDownloadSuccess('24-Bit WAV One-Shot sample exported.');
      }
    } catch (e) {
      console.error('Audio export error', e);
    } finally {
      setIsRenderingAudio(false);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }
  };

  const handleZipExport = async () => {
    setIsExportingZip(true);
    try {
      await CppSourceArchive.downloadZip();
      setDownloadSuccess('C++ JUCE VST3 CMake repository downloaded.');
    } catch (e) {
      console.error('Zip download error', e);
    } finally {
      setIsExportingZip(false);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#11131a] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2330]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              Export Center
            </h2>
            <p className="text-xs text-neutral-400">
              Standard MIDI, 24-bit Studio WAV Audio, and Native C++ VST3 Project
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-[#181c26] hover:bg-[#202534] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {downloadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* 1. MIDI Export */}
          <div className="p-4 bg-[#141722] border border-[#222736] rounded-xl flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[#0e1017] text-amber-500">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Standard MIDI File (.mid)
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Type 0 SMF with precise tempo, swing offsets, pitch drops, and velocity. Ready for Ableton, FL Studio, Logic, Cubase.
                </p>
              </div>
            </div>

            <button
              onClick={handleMidiExport}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              Export .MID
            </button>
          </div>

          {/* 2. Audio WAV Export */}
          <div className="p-4 bg-[#141722] border border-[#222736] rounded-xl flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[#0e1017] text-cyan-500">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  24-bit / 44.1kHz Studio WAV
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Offline rendered with high-precision synthesis DSP and natural decay tail.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAudioExport('oneshot')}
                disabled={isRenderingAudio}
                className="px-3 py-2 bg-[#1b202e] hover:bg-[#242b3e] text-neutral-200 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border border-[#283044]"
              >
                One-Shot
              </button>
              <button
                onClick={() => handleAudioExport('pattern')}
                disabled={isRenderingAudio}
                className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
              >
                {isRenderingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Render Loop</span>
              </button>
            </div>
          </div>

          {/* 3. C++ JUCE VST3 Project Export */}
          <div className="p-4 bg-[#141722] border border-[#222736] rounded-xl flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[#0e1017] text-amber-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  C++ JUCE VST3 CMake Repository
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Full C++20 source tree with CMakeLists.txt, AudioProcessor, DSP classes, and sequencer for native desktop compilation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCppViewer}
                className="px-3 py-2 bg-[#1b202e] hover:bg-[#242b3e] text-neutral-200 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border border-[#283044]"
              >
                View Code
              </button>
              <button
                onClick={handleZipExport}
                disabled={isExportingZip}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
              >
                {isExportingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Download .ZIP</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
