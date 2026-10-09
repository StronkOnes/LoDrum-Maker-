# LoDrum Maker — The Plugin Foundry
## Original Log Drum Instrument & Pattern Creator (VST3 / AU / Standalone)

LoDrum Maker is a dedicated software instrument and log drum sound-design workstation built for modern Gqom, Amapiano, and electronic bass music.

### Features
* **Hybrid Synthesis Engine:** Tuned Body Oscillator with sub-harmonic reinforcement, dedicated Pitch-Drop Engine with variable curves, Transient knock click & wood slap generator, Polynomial and foldback harmonic waveshaper, resonant biquad filter.
* **10 Signature Macros:** Weight, Knock, Drop, Decay, Growl, Bite, Drive, Slide, Tone, Output.
* **Built-in Pattern Sequencer:** 16/32 steps, pitch editor, per-step velocity, accents, slides, swing, and algorithmic phrase generator.
* **Standard MIDI & Studio Audio Export:** Spec-compliant SMF Type 0 MIDI exporter and 24-bit WAV stem renderer.
* **12 Factory Presets:** Deep Foundation, Tight Knock, Long Pitch Drop, Dirty Club Log, Rounded Sub, Sharp Attack, Dark Gqom Pulse, Amapiano Bounce, Rolling Log, Experimental Growl, Short Percussive Bass, Wide Character Layer.

### Desktop CMake Build Instructions

#### Windows x64 (MSVC 2022)
```powershell
cmake -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release
```

#### macOS (Apple Silicon / Intel)
```bash
cmake -B build -G Xcode
cmake --build build --config Release
```

#### Linux
```bash
cmake -B build -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
```
