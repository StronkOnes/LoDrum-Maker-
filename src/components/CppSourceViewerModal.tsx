/**
 * LoDrum Maker - C++ JUCE VST3 Source Code Viewer
 * The Plugin Foundry
 */

import React, { useState } from 'react';
import { JUCE_VST3_SOURCES, CppSourceArchive } from '../export_vst3/cppSourceArchive';
import { Copy, Check, Download, FileText } from 'lucide-react';

interface CppSourceViewerModalProps {
  onClose: () => void;
}

export const CppSourceViewerModal: React.FC<CppSourceViewerModalProps> = ({ onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedFile = JUCE_VST3_SOURCES[selectedFileIndex] || JUCE_VST3_SOURCES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#11131a] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2330]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">
              C++ JUCE VST3 Source Tree
            </h2>
            <p className="text-xs text-neutral-400">
              Modern C++20 / JUCE 7 Architectural Implementation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => CppSourceArchive.downloadZip()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-[#181c26] hover:bg-[#202534] transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 bg-[#0d0f16] border-r border-[#1e2330] p-3 overflow-y-auto custom-scrollbar flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
              Project Files
            </span>
            {JUCE_VST3_SOURCES.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`text-left px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors flex items-center gap-2 truncate ${
                  selectedFileIndex === idx
                    ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#151822]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-[#08090d] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#12141c] border-b border-[#1d222e]">
              <span className="font-mono text-xs text-neutral-300">
                {selectedFile.path}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="flex-1 p-4 font-mono text-xs text-neutral-300 overflow-auto custom-scrollbar leading-relaxed">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
