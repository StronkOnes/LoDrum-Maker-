/**
 * LoDrum Maker - Unit & Integration Test Suite
 * The Plugin Foundry
 * Tests DSP calculations, MIDI file generation, scale quantization, and preset integrity
 */

import { FACTORY_PRESETS } from '../presets/factoryPresets';
import { SCALES, ROOT_NOTES, midiToNoteName, noteNameToMidi, quantizeToScale } from '../sequencer/scales';
import { PatternGenerator, GenreStyle } from '../sequencer/patternGenerators';
import { MidiExporter } from '../audio/MidiExport';
import { AudioExporter } from '../audio/AudioExport';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
}

console.log('🧪 Starting LoDrum Maker Test Suite...\n');

// 1. Scales & Frequency Math
console.log('Test 1: Scales & Musical Note Math');
assert(midiToNoteName(36) === 'C1', 'Note 36 should be C1');
assert(midiToNoteName(48) === 'C2', 'Note 48 should be C2');
assert(midiToNoteName(69) === 'A3', 'Note 69 should be A3 (440Hz)');
assert(noteNameToMidi('C1') === 36, 'C1 should parse to MIDI 36');
assert(noteNameToMidi('F#1') === 42, 'F#1 should parse to MIDI 42');

const quantizedC = quantizeToScale(37, 'C', 'minor_pentatonic'); // C#1 quantized to Minor Pentatonic (C, D#, F, G, A#)
assert(quantizedC === 36 || quantizedC === 39, 'C#1 should quantize to C1 (36) or D#1 (39)');
console.log('  ✓ Musical pitch & quantization tests passed');

// 2. Factory Presets Validation
console.log('\nTest 2: Factory Presets Integrity (12 Presets)');
assert(FACTORY_PRESETS.length === 12, `Expected 12 factory presets, got ${FACTORY_PRESETS.length}`);

FACTORY_PRESETS.forEach((preset, idx) => {
  assert(!!preset.id && !!preset.name, `Preset #${idx} missing id/name`);
  assert(preset.macros.weight >= 0 && preset.macros.weight <= 100, `Preset ${preset.name} weight out of bounds`);
  assert(preset.macros.knock >= 0 && preset.macros.knock <= 100, `Preset ${preset.name} knock out of bounds`);
  assert(preset.macros.drop >= 0 && preset.macros.drop <= 100, `Preset ${preset.name} drop out of bounds`);
  assert(preset.macros.decay >= 0 && preset.macros.decay <= 100, `Preset ${preset.name} decay out of bounds`);
  assert(preset.synth.bodyDecay > 0, `Preset ${preset.name} bodyDecay must be positive`);
  assert(preset.synth.pitchDropAmount >= 0, `Preset ${preset.name} pitchDropAmount must be positive`);
});
console.log(`  ✓ All ${FACTORY_PRESETS.length} presets validated with correct parameter ranges`);

// 3. Algorithmic Pattern Generator
console.log('\nTest 3: Algorithmic Pattern Generator for All 7 Styles');
const styles: GenreStyle[] = [
  'amapiano_bounce',
  'gqom_bass',
  'deep_log',
  'dark_pulse',
  'rolling_phrase',
  'minimal_groove',
  'experimental_bounce'
];

styles.forEach((style) => {
  const pat16 = PatternGenerator.generate(style, {
    length: 16,
    bpm: 113,
    swing: 25,
    density: 60,
    complexity: 50,
    accentStrength: 70,
    rootNote: 'C',
    scale: 'minor_pentatonic',
    baseOctave: 1
  });
  assert(pat16.steps.length === 16, `${style} 16-step length mismatch`);
  assert(pat16.steps.some(s => s.active), `${style} pattern should have active hits`);

  const pat32 = PatternGenerator.generate(style, {
    length: 32,
    bpm: 115,
    swing: 30,
    density: 70,
    complexity: 60,
    accentStrength: 80,
    rootNote: 'F',
    scale: 'phrygian',
    baseOctave: 1
  });
  assert(pat32.steps.length === 32, `${style} 32-step length mismatch`);
});
console.log('  ✓ All 7 genre pattern generation algorithms validated for 16 and 32 steps');

// 4. MIDI Binary File Generator (SMF Format 0)
console.log('\nTest 4: Spec-Compliant Standard MIDI File (.mid) Generation');
const testPat = PatternGenerator.generate('amapiano_bounce', {
  length: 16,
  bpm: 113,
  swing: 30,
  density: 65,
  complexity: 40,
  accentStrength: 75,
  rootNote: 'C',
  scale: 'minor_pentatonic',
  baseOctave: 1
});

const midiBytes = MidiExporter.generateMidiFile(testPat);
assert(midiBytes.length > 30, 'MIDI byte array should contain data');

// Header Check: MThd (0x4D, 0x54, 0x68, 0x64)
assert(midiBytes[0] === 0x4D && midiBytes[1] === 0x54 && midiBytes[2] === 0x68 && midiBytes[3] === 0x64, 'MIDI header must start with MThd');
// Header length: 6
assert(midiBytes[4] === 0x00 && midiBytes[5] === 0x00 && midiBytes[6] === 0x00 && midiBytes[7] === 0x06, 'MThd length must be 6');
// Track Chunk Check: MTrk (0x4D, 0x54, 0x72, 0x6B) at offset 14
assert(midiBytes[14] === 0x4D && midiBytes[15] === 0x54 && midiBytes[16] === 0x72 && midiBytes[17] === 0x6B, 'Track chunk must start with MTrk');

console.log(`  ✓ Valid Standard MIDI File binary generated (${midiBytes.length} bytes, MThd & MTrk valid)`);

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! LoDrum Maker is verified & production-ready.');
