#pragma once
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
        void setWeight(float val);
        void setKnock(float val);
        void setDrop(float val);
        void setDecay(float val);
        void setGrowl(float val);
        void setBite(float val);
        void setDrive(float val);
        void setSlide(float val);
        void setTone(float val);
        void setOutput(float val);

    private:
        static constexpr int MaxPolyphony = 8;
        std::array<Voice, MaxPolyphony> voices;
        double currentSampleRate = 44100.0;
        int lastNoteNumber = -1;

        // Limiter
        juce::dsp::Limiter<float> masterLimiter;
        float masterVolume = 0.85f;
    };
}
