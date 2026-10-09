/**
 * LoDrum Maker - Mode C: Live Performance Workstation
 * The Plugin Foundry | Section 3
 * Interactive 2-octave playable keyboard, touch-pads, pitch bend, and hardware MIDI monitor
 */

import React, { useState, useEffect } from 'react';
import { LoDrumEngine } from '../audio/LoDrumEngine';
import { WebMidiManager, MidiDevice } from '../audio/WebMidiManager';
import { ROOT_NOTES, midiToNoteName } from '../sequencer/scales';
import { Radio, Activity } from 'lucide-react';

interface PerformViewProps {
  glideTime: number;
}

export const PerformView: React.FC<PerformViewProps> = () => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [isSlideActive, setIsSlideActive] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState(0); // -1, 0, +1
  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([]);
  const [lastMidiActivity, setLastMidiActivity] = useState<string | null>(null);

  const engine = LoDrumEngine.getInstance();
  const midiMgr = WebMidiManager.getInstance();

  useEffect(() => {
    midiMgr.init();
    midiMgr.onDeviceListChange(setMidiDevices);
    midiMgr.onMidiActivity((note, vel) => {
      setLastMidiActivity(`${midiToNoteName(note)} (Vel ${vel})`);
      setActiveNotes(prev => new Set(prev).add(note));
      setTimeout(() => {
        setActiveNotes(prev => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
      }, 200);
    });
  }, []);

  const handleNoteOn = (note: number, velocity: number = 100) => {
    setActiveNotes(prev => new Set(prev).add(note));
    engine.triggerNote(note, velocity, isSlideActive);
  };

  const handleNoteOff = (note: number) => {
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    engine.releaseNote(note);
  };

  // Computer keyboard listener
  useEffect(() => {
    const keyMap: Record<string, number> = {
      'a': 36, 'w': 37, 's': 38, 'e': 39, 'd': 40, 'f': 41,
      't': 42, 'g': 43, 'y': 44, 'h': 45, 'u': 46, 'j': 47, 'k': 48
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      if (keyMap[key] !== undefined && !e.repeat) {
        const note = keyMap[key] + octaveOffset * 12;
        handleNoteOn(note, 105);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyMap[key] !== undefined) {
        const note = keyMap[key] + octaveOffset * 12;
        handleNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveOffset, isSlideActive]);

  // Quick Trigger Pads
  const triggerPads = [
    { name: 'Sub C1', note: 36, color: 'bg-amber-600' },
    { name: 'Low D#1', note: 39, color: 'bg-amber-700' },
    { name: 'Punch F1', note: 41, color: 'bg-amber-600' },
    { name: 'Gqom F#1', note: 42, color: 'bg-orange-700' },
    { name: 'Harmonic G1', note: 43, color: 'bg-amber-600' },
    { name: 'Slide A#1', note: 46, color: 'bg-cyan-700' },
    { name: 'Mid C2', note: 48, color: 'bg-cyan-600' },
    { name: 'High D#2', note: 51, color: 'bg-cyan-700' },
  ];

  // Piano keys (2 Octaves: C1 36 to C3 60)
  const baseMidi = 36 + octaveOffset * 12;
  const numKeys = 25; // 2 full octaves + top C

  const keys = Array.from({ length: numKeys }, (_, i) => {
    const midi = baseMidi + i;
    const noteClass = midi % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(noteClass);
    return { midi, isBlack, name: midiToNoteName(midi) };
  });

  return (
    <div className="w-full bg-[#11131a] border border-[#212532] rounded-xl p-4 shadow-xl flex flex-col gap-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1d222e]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Live Performance Controller
          </span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-xs text-neutral-400">
            Velocity Touch Keyboard & Trigger Pads
          </span>
        </div>

        {/* MIDI Hardware Status & Octave Controls */}
        <div className="flex items-center gap-3">
          {/* Hardware MIDI Status */}
          <div className="flex items-center gap-2 bg-[#0c0e14] px-2.5 py-1 rounded-lg border border-[#1e222e] text-xs">
            <Radio className={`w-3.5 h-3.5 ${midiDevices.length > 0 ? 'text-emerald-400 animate-pulse' : 'text-neutral-400'}`} />
            <span className="text-neutral-300">
              {midiDevices.length > 0 ? `${midiDevices[0].name}` : 'Web MIDI Active'}
            </span>
            {lastMidiActivity && (
              <span className="font-mono text-amber-400 text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded">
                {lastMidiActivity}
              </span>
            )}
          </div>

          {/* Slide Lock Toggle */}
          <button
            onClick={() => setIsSlideActive(!isSlideActive)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
              isSlideActive
                ? 'bg-cyan-500 text-neutral-950 border-cyan-400'
                : 'bg-[#181c26] text-neutral-400 border-[#252b3b] hover:text-white'
            }`}
          >
            Glide {isSlideActive ? 'ON' : 'OFF'}
          </button>

          {/* Octave Controls */}
          <div className="flex items-center p-0.5 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
            <button
              onClick={() => setOctaveOffset(Math.max(-2, octaveOffset - 1))}
              className="px-2 py-1 text-xs text-neutral-300 hover:text-white font-mono"
              title="Octave Down"
            >
              Oct -
            </button>
            <span className="px-2 text-xs font-mono font-bold text-amber-400">
              {octaveOffset >= 0 ? `+${octaveOffset}` : octaveOffset}
            </span>
            <button
              onClick={() => setOctaveOffset(Math.min(2, octaveOffset + 1))}
              className="px-2 py-1 text-xs text-neutral-300 hover:text-white font-mono"
              title="Octave Up"
            >
              Oct +
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Trigger Performance Pads */}
      <div>
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-2">
          Expressive Touch Pads (8 Harmonic Centers)
        </label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
          {triggerPads.map((pad, idx) => {
            const actualMidi = pad.note + octaveOffset * 12;
            const isPressed = activeNotes.has(actualMidi);

            return (
              <button
                key={idx}
                onMouseDown={() => handleNoteOn(actualMidi, 115)}
                onMouseUp={() => handleNoteOff(actualMidi)}
                onMouseLeave={() => isPressed && handleNoteOff(actualMidi)}
                onTouchStart={() => handleNoteOn(actualMidi, 120)}
                onTouchEnd={() => handleNoteOff(actualMidi)}
                className={`h-20 rounded-xl p-2.5 flex flex-col justify-between items-start transition-all border select-none ${
                  isPressed
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-[0.98]'
                    : 'bg-[#151822] hover:bg-[#1c212f] text-neutral-200 border-[#242938]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-bold ${isPressed ? 'text-neutral-950' : 'text-neutral-300'}`}>
                    {pad.name}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${isPressed ? 'bg-neutral-950' : 'bg-neutral-700'}`} />
                </div>
                <span className={`text-[10px] font-mono ${isPressed ? 'text-neutral-950' : 'text-neutral-400'}`}>
                  {midiToNoteName(actualMidi)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Playable Piano Keyboard */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
            2-Octave Responsive Keyboard (Click lower for higher velocity)
          </label>
          <span className="text-[10px] text-neutral-400">
            Keys: A W S E D F T G Y H U J K
          </span>
        </div>

        {/* Piano Roll Graphic */}
        <div className="relative h-44 bg-[#0a0c10] border border-[#202534] rounded-xl p-1.5 flex overflow-hidden select-none">
          {/* White keys */}
          <div className="flex w-full h-full">
            {keys
              .filter(k => !k.isBlack)
              .map((key) => {
                const isPressed = activeNotes.has(key.midi);
                return (
                  <div
                    key={key.midi}
                    onMouseDown={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const relY = (e.clientY - rect.top) / rect.height;
                      const vel = Math.round(50 + relY * 77); // 50 to 127
                      handleNoteOn(key.midi, vel);
                    }}
                    onMouseUp={() => handleNoteOff(key.midi)}
                    onMouseLeave={() => isPressed && handleNoteOff(key.midi)}
                    className={`flex-1 h-full mx-[1px] rounded-b-md flex flex-col justify-end items-center pb-2 transition-colors cursor-pointer border ${
                      isPressed
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
                        : 'bg-[#e2e8f0] text-neutral-800 border-neutral-300 hover:bg-white'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold">
                      {key.name}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Black keys overlaid */}
          <div className="absolute inset-x-0 top-0 h-[60%] flex pointer-events-none px-1.5">
            {keys.map((key, i) => {
              if (!key.isBlack) {
                // Gap spacer for white key
                return <div key={key.midi} className="flex-1 pointer-events-none" />;
              }
              const isPressed = activeNotes.has(key.midi);
              return (
                <div
                  key={key.midi}
                  className="relative -mx-[2.5%] w-[5%] z-20 pointer-events-auto"
                >
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const relY = (e.clientY - rect.top) / rect.height;
                      const vel = Math.round(60 + relY * 67);
                      handleNoteOn(key.midi, vel);
                    }}
                    onMouseUp={() => handleNoteOff(key.midi)}
                    onMouseLeave={() => isPressed && handleNoteOff(key.midi)}
                    className={`w-full h-full rounded-b-md flex flex-col justify-end items-center pb-1 transition-colors cursor-pointer border ${
                      isPressed
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                        : 'bg-[#181a22] text-neutral-300 border-[#2d3242] hover:bg-[#252836]'
                    }`}
                  >
                    <span className="text-[8px] font-mono font-bold">
                      {key.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
