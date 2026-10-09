/**
 * LoDrum Maker - Musical Scales & Note Helpers
 * The Plugin Foundry
 */

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface ScaleDefinition {
  id: string;
  name: string;
  intervals: number[]; // Semitone intervals from root
}

export const SCALES: ScaleDefinition[] = [
  { id: 'chromatic', name: 'Chromatic (All Notes)', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'minor_pentatonic', name: 'Minor Pentatonic (Amapiano classic)', intervals: [0, 3, 5, 7, 10] },
  { id: 'natural_minor', name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'phrygian', name: 'Phrygian (Dark Gqom tension)', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'dorian', name: 'Dorian (Soulful Deep House)', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'harmonic_minor', name: 'Harmonic Minor (Exotic punch)', intervals: [0, 2, 3, 5, 7, 8, 11] },
];

export function midiToNoteName(midi: number): string {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 2;
  return `${ROOT_NOTES[noteIndex]}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 36;
  const note = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = ROOT_NOTES.indexOf(note);
  return (octave + 2) * 12 + noteIndex;
}

/**
 * Quantizes a MIDI note to the nearest note in the given scale and root
 */
export function quantizeToScale(midiNote: number, rootNote: string, scaleId: string): number {
  if (scaleId === 'chromatic') return midiNote;

  const scale = SCALES.find(s => s.id === scaleId) || SCALES[0];
  const rootIndex = ROOT_NOTES.indexOf(rootNote);
  if (rootIndex === -1) return midiNote;

  const notePitchClass = midiNote % 12;
  const octave = Math.floor(midiNote / 12);

  // Find valid pitch classes in this scale
  const validPitchClasses = scale.intervals.map(interval => (rootIndex + interval) % 12);

  if (validPitchClasses.includes(notePitchClass)) {
    return midiNote;
  }

  // Find nearest valid pitch class
  let minDiff = 12;
  let bestPitchClass = validPitchClasses[0];

  for (const vpc of validPitchClasses) {
    const diff = Math.min(
      Math.abs(vpc - notePitchClass),
      12 - Math.abs(vpc - notePitchClass)
    );
    if (diff < minDiff) {
      minDiff = diff;
      bestPitchClass = vpc;
    }
  }

  return octave * 12 + bestPitchClass;
}
