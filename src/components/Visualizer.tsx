/**
 * LoDrum Maker - Real-Time Audio Visualizer & Envelope Display
 * The Plugin Foundry
 * Oscilloscope, FFT Spectrum Analyzer, and Dynamic Pitch Drop Curve
 */

import React, { useRef, useEffect, useState } from 'react';
import { AudioContextManager } from '../audio/AudioContextManager';
import { SynthParameters, MacroParameters } from '../audio/types';

interface VisualizerProps {
  params: SynthParameters;
  macros: MacroParameters;
}

export const Visualizer: React.FC<VisualizerProps> = ({ params, macros }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'scope' | 'spectrum' | 'envelope'>('scope');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const audioMgr = AudioContextManager.getInstance();
    const analyser = audioMgr.getAnalyser();

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Dark background with subtle grid
      ctx.fillStyle = '#0c0e14';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#181c26';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      if (viewMode === 'scope') {
        analyser.getByteTimeDomainData(timeData);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f59e0b'; // Amber beam
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

      } else if (viewMode === 'spectrum') {
        analyser.getByteFrequencyData(freqData);

        const barCount = 64;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          // Logarithmic bin sampling focused on sub bass (20Hz - 2kHz)
          const binIndex = Math.floor(Math.pow(i / barCount, 2.2) * (bufferLength / 3));
          const val = freqData[binIndex] || 0;
          const barHeight = (val / 255) * (height - 12);
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient from warm amber sub to electric cyan highs
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.7, '#06b6d4');
          grad.addColorStop(1, '#22d3ee');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);
        }

      } else if (viewMode === 'envelope') {
        // Render synthetic Pitch-Drop and Amplitude trajectories
        const dropAmount = params.pitchDropAmount;
        const dropTime = params.pitchDropTime;
        const decayTime = params.bodyDecay;

        // 1. Pitch Drop Curve (Amber)
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();

        const dropSamples = 120;
        for (let i = 0; i <= dropSamples; i++) {
          const t = i / dropSamples; // 0.0 to 1.0 (representing 0 to 0.4s)
          let pitchNorm = 0;
          if (params.pitchDropCurve === 'punchy') {
            pitchNorm = Math.exp(-t * 8.0) * (dropAmount / 48);
          } else if (params.pitchDropCurve === 'exponential') {
            pitchNorm = Math.exp(-t * 5.0) * (dropAmount / 48);
          } else {
            pitchNorm = Math.max(0, 1.0 - t * 2.5) * (dropAmount / 48);
          }

          const x = t * (width * 0.7);
          const y = height * 0.85 - pitchNorm * (height * 0.7);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 2. Amplitude Envelope Curve (Cyan)
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#06b6d4';
        ctx.beginPath();

        for (let i = 0; i <= dropSamples; i++) {
          const t = i / dropSamples;
          const ampNorm = Math.exp(-t * (1.8 / Math.max(0.1, decayTime)));
          const x = t * width;
          const y = height * 0.9 - ampNorm * (height * 0.8);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Annotations
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`PITCH DROP: +${dropAmount}st (${Math.round(dropTime * 1000)}ms)`, 14, 22);

        ctx.fillStyle = '#06b6d4';
        ctx.fillText(`AMPLITUDE DECAY: ${decayTime.toFixed(2)}s`, 14, 38);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [viewMode, params, macros]);

  return (
    <div className="relative w-full h-36 bg-[#0c0e14] border border-[#212532] rounded-xl overflow-hidden shadow-inner flex flex-col justify-between">
      {/* Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={144}
        className="w-full h-full block"
      />

      {/* Mode Switcher Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 p-0.5 bg-[#141720]/80 backdrop-blur-sm rounded-lg border border-[#232733]">
        <button
          onClick={() => setViewMode('scope')}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${
            viewMode === 'scope'
              ? 'bg-amber-500 text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Oscilloscope
        </button>
        <button
          onClick={() => setViewMode('spectrum')}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${
            viewMode === 'spectrum'
              ? 'bg-cyan-500 text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Spectrum
        </button>
        <button
          onClick={() => setViewMode('envelope')}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-nowrap ${
            viewMode === 'envelope'
              ? 'bg-amber-500 text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Envelopes
        </button>
      </div>

      {/* Audio Engine Spec Tag */}
      <div className="absolute bottom-2 left-3 text-[10px] font-mono text-neutral-400 pointer-events-none">
        44.1kHz · 24-bit DSP Hybrid Synthesis Engine
      </div>
    </div>
  );
};
