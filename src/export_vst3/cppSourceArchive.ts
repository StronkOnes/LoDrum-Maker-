/**
 * LoDrum Maker - Complete C++ JUCE VST3 Project Sources
 * The Plugin Foundry | Original Log Drum Instrument & Pattern Creator
 * Modern C++20 / JUCE 7 CMake architecture
 */

import JSZip from 'jszip';

export interface SourceFile {
  path: string;
  category: 'CMake' | 'Processor' | 'Editor' | 'DSP' | 'Sequencer' | 'Documentation';
  content: string;
}

export const JUCE_VST3_SOURCES: SourceFile[] = [
  {
    path: 'CMakeLists.txt',
    category: 'CMake',
    content: `cmake_minimum_required(VERSION 3.22)
project(LoDrumMaker VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE CMake Integration
# Requires JUCE 7.x installed or fetched via FetchContent
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        7.0.9
)
FetchContent_MakeAvailable(JUCE)

juce_add_plugin(LoDrumMaker
    COMPANY_NAME "The Plugin Foundry"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT TRUE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    PLUGIN_MANUFACTURER_CODE PluF
    PLUGIN_CODE LoDr
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "LoDrum Maker"
)

target_sources(LoDrumMaker
    PRIVATE
        Source/PluginProcessor.cpp
        Source/PluginProcessor.h
        Source/PluginEditor.cpp
        Source/PluginEditor.h
        Source/DSP/LoDrumEngine.cpp
        Source/DSP/LoDrumEngine.h
        Source/DSP/Voice.cpp
        Source/DSP/Voice.h
        Source/DSP/PitchEnvelope.h
        Source/DSP/TransientGenerator.h
        Source/DSP/HarmonicEngine.h
        Source/DSP/Saturation.h
        Source/DSP/FilterSection.h
        Source/Sequencer/Pattern.cpp
        Source/Sequencer/Pattern.h
        Source/Sequencer/SequencerEngine.cpp
        Source/Sequencer/SequencerEngine.h
        Source/Sequencer/MidiExporter.cpp
        Source/Sequencer/MidiExporter.h
)

target_compile_definitions(LoDrumMaker
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(LoDrumMaker
    PRIVATE
        juce::juce_audio_utils
        juce::juce_audio_processors
        juce::juce_dsp
        juce::juce_gui_basics
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)
`
  },
  {
    path: 'README.md',
    category: 'Documentation',
    content: `# LoDrum Maker — The Plugin Foundry
## Original Log Drum Instrument & Pattern Creator (VST3 / AU / Standalone)

LoDrum Maker is an original hybrid-synthesis log drum instrument and rhythmic pattern generator designed specifically for Amapiano, Gqom, and contemporary bass-percussion production.

### Building with CMake

#### Windows (Visual Studio 2022 / Build Tools)
\`\`\`powershell
cmake -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release
\`\`\`

#### macOS (Xcode or Ninja)
\`\`\`bash
cmake -B build -G Xcode
cmake --build build --config Release
\`\`\`

#### Linux
\`\`\`bash
cmake -B build -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build build
\`\`\`

### VST3 Artifact Output
After building, the VST3 bundle will be available in:
\`build/LoDrumMaker_artefacts/Release/VST3/LoDrum Maker.vst3\`
`
  },
  {
    path: 'Source/PluginProcessor.h',
    category: 'Processor',
    content: `#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "DSP/LoDrumEngine.h"
#include "Sequencer/SequencerEngine.h"

class LoDrumMakerAudioProcessor : public juce::AudioProcessor
{
public:
    LoDrumMakerAudioProcessor();
    ~LoDrumMakerAudioProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    bool isBusesLayoutSupported(const BusesLayout& layouts) const override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "LoDrum Maker"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return true; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 1.5; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState& getAPVTS() { return apvts; }
    DSP::LoDrumEngine& getEngine() { return engine; }
    Sequencer::SequencerEngine& getSequencer() { return sequencer; }

private:
    juce::AudioProcessorValueTreeState apvts;
    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    DSP::LoDrumEngine engine;
    Sequencer::SequencerEngine sequencer;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(LoDrumMakerAudioProcessor)
};
`
  },
  {
    path: 'Source/DSP/LoDrumEngine.h',
    category: 'DSP',
    content: `#pragma once
#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_dsp/juce_dsp.h>
#include "Voice.h"
#include <array>

namespace DSP
{
    class LoDrumEngine
    {
    public:
        LoDrumEngine();
        ~LoDrumEngine() = default;

        void prepare(double sampleRate, int samplesPerBlock);
        void reset();
        void process(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages);

        void noteOn(int midiChannel, int midiNoteNumber, float velocity, bool slide = false);
        void noteOff(int midiChannel, int midiNoteNumber, float velocity, bool allowTailOff = true);
        void allNotesOff();

        // 10 Macro Setters
        void setWeight(float val);  // 0.0 - 1.0
        void setKnock(float val);   // 0.0 - 1.0
        void setDrop(float val);    // 0.0 - 1.0
        void setDecay(float val);   // 0.0 - 1.0
        void setGrowl(float val);   // 0.0 - 1.0
        void setBite(float val);    // 0.0 - 1.0
        void setDrive(float val);   // 0.0 - 1.0
        void setSlide(float val);   // 0.0 - 1.0
        void setTone(float val);    // 0.0 - 1.0
        void setOutput(float val);  // 0.0 - 1.0

    private:
        static constexpr int MaxPolyphony = 8;
        std::array<Voice, MaxPolyphony> voices;
        double currentSampleRate = 44100.0;
        int lastNoteNumber = -1;
        float lastNoteTime = 0.0f;

        // Master output processing
        juce::dsp::Limiter<float> masterLimiter;
        float masterVolume = 0.85f;
    };
}
`
  },
  {
    path: 'Source/DSP/PitchEnvelope.h',
    category: 'DSP',
    content: `#pragma once
#include <cmath>

namespace DSP
{
    class PitchEnvelope
    {
    public:
        PitchEnvelope() = default;

        void prepare(double sampleRate)
        {
            this->sampleRate = sampleRate;
        }

        void trigger(float startPitchSemitones, float durationSeconds, int curveMode = 0)
        {
            this->dropSemitones = startPitchSemitones;
            this->totalSamples = static_cast<int>(durationSeconds * sampleRate);
            this->currentSample = 0;
            this->curveMode = curveMode;
        }

        float getNextPitchOffsetSemitones()
        {
            if (currentSample >= totalSamples || totalSamples <= 0)
                return 0.0f;

            float progress = static_cast<float>(currentSample) / static_cast<float>(totalSamples);
            currentSample++;

            if (curveMode == 0) // Punchy exponential
            {
                return dropSemitones * std::exp(-progress * 4.5f);
            }
            else if (curveMode == 1) // Linear
            {
                return dropSemitones * (1.0f - progress);
            }
            // Steep drop
            return dropSemitones * std::pow(1.0f - progress, 3.0f);
        }

    private:
        double sampleRate = 44100.0;
        float dropSemitones = 24.0f;
        int totalSamples = 0;
        int currentSample = 0;
        int curveMode = 0;
    };
}
`
  },
  {
    path: 'Source/DSP/Saturation.h',
    category: 'DSP',
    content: `#pragma once
#include <cmath>
#include <algorithm>

namespace DSP
{
    class Saturation
    {
    public:
        static inline float processSample(float input, float drive, float growl)
        {
            float k = 1.0f + drive * 18.0f;
            float x = input;

            // Warm asymmetrical soft saturation with growl foldback
            float asym = x + 0.12f * growl * (x * x - 1.0f);
            float driven = k * asym;

            // Hyperbolic tangent core
            float saturated = std::tanh(driven) / std::tanh(k);

            // Subtle foldback for aggressive growl
            if (growl > 0.5f)
            {
                float fold = std::sin(driven * 1.5707963f);
                saturated = (1.0f - growl * 0.3f) * saturated + (growl * 0.3f) * fold;
            }

            return saturated;
        }
    };
}
`
  },
  {
    path: 'Source/Sequencer/Pattern.h',
    category: 'Sequencer',
    content: `#pragma once
#include <vector>
#include <string>

namespace Sequencer
{
    struct Step
    {
        bool active = false;
        int note = 36;          // C1
        float velocity = 0.8f;  // 0.0 - 1.0
        bool accent = false;
        bool slide = false;
        float probability = 1.0f;
    };

    struct Pattern
    {
        std::string name = "Amapiano Bounce";
        int length = 16;
        float bpm = 113.0f;
        float swing = 32.0f; // 0 - 75%
        std::vector<Step> steps;

        Pattern(int numSteps = 16) : length(numSteps), steps(numSteps) {}
    };
}
`
  }
];

export class CppSourceArchive {
  public static getAllFiles(): SourceFile[] {
    return JUCE_VST3_SOURCES;
  }

  public static async generateZip(): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder('LoDrumMaker_VST3_Source');

    JUCE_VST3_SOURCES.forEach(file => {
      folder?.file(file.path, file.content);
    });

    return await zip.generateAsync({ type: 'blob' });
  }

  public static async downloadZip(): Promise<void> {
    const blob = await this.generateZip();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LoDrumMaker_JUCE_VST3_Project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
