/**
 * LoDrum Maker - The Log Drum Macro Panel
 * The Plugin Foundry | Section 5
 * Central command strip with the 10 signature log drum sound design macros
 */

import React from 'react';
import { Knob } from './Knob';
import { MacroParameters } from '../audio/types';

interface MacroPanelProps {
  macros: MacroParameters;
  onMacroChange: (key: keyof MacroParameters, val: number) => void;
}

export const MacroPanel: React.FC<MacroPanelProps> = ({ macros, onMacroChange }) => {
  return (
    <div className="w-full bg-[#11131a] border border-[#212532] rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1d222e]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-500">
            Log Drum Macros
          </span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-xs text-neutral-400">
            Real-time DSP Macro Matrix
          </span>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono">
          10 Active Parameters
        </div>
      </div>

      {/* Grid of 10 Rotary Knobs */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-3 md:gap-2 justify-items-center">
        {/* 1. Weight */}
        <Knob
          label="Weight"
          value={macros.weight}
          defaultValue={55}
          color="amber"
          unit="%"
          onChange={(v) => onMacroChange('weight', v)}
        />

        {/* 2. Knock */}
        <Knob
          label="Knock"
          value={macros.knock}
          defaultValue={60}
          color="amber"
          unit="%"
          onChange={(v) => onMacroChange('knock', v)}
        />

        {/* 3. Drop */}
        <Knob
          label="Drop"
          value={macros.drop}
          defaultValue={50}
          color="amber"
          unit="%"
          onChange={(v) => onMacroChange('drop', v)}
        />

        {/* 4. Decay */}
        <Knob
          label="Decay"
          value={macros.decay}
          defaultValue={45}
          color="amber"
          unit="%"
          onChange={(v) => onMacroChange('decay', v)}
        />

        {/* 5. Growl */}
        <Knob
          label="Growl"
          value={macros.growl}
          defaultValue={35}
          color="copper"
          unit="%"
          onChange={(v) => onMacroChange('growl', v)}
        />

        {/* 6. Bite */}
        <Knob
          label="Bite"
          value={macros.bite}
          defaultValue={50}
          color="amber"
          unit="%"
          onChange={(v) => onMacroChange('bite', v)}
        />

        {/* 7. Drive */}
        <Knob
          label="Drive"
          value={macros.drive}
          defaultValue={30}
          color="copper"
          unit="%"
          onChange={(v) => onMacroChange('drive', v)}
        />

        {/* 8. Slide */}
        <Knob
          label="Slide"
          value={macros.slide}
          defaultValue={40}
          color="cyan"
          unit="%"
          onChange={(v) => onMacroChange('slide', v)}
        />

        {/* 9. Tone */}
        <Knob
          label="Tone"
          value={macros.tone}
          defaultValue={60}
          color="amber"
          unit="%"
          onChange={(v) => onMacroChange('tone', v)}
        />

        {/* 10. Output */}
        <Knob
          label="Output"
          value={macros.output}
          defaultValue={80}
          color="cyan"
          unit="%"
          onChange={(v) => onMacroChange('output', v)}
        />
      </div>
    </div>
  );
};
