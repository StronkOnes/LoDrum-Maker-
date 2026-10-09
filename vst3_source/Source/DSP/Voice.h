#pragma once
#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_dsp/juce_dsp.h>
#include "PitchEnvelope.h"
#include "Saturation.h"

namespace DSP
{
    class Voice
    {
    public:
        Voice();

        void prepare(double sampleRate);
        void startNote(int midiNoteNumber, float velocity, int previousNoteNumber = -1);
        void stopNote();
        void renderNextBlock(juce::AudioBuffer<float>& outputBuffer, int startSample, int numSamples);

        bool isActive() const { return active; }
        int getCurrentlyPlayingNote() const { return currentNote; }

        void setWeight(float val) { weight = val; }
        void setKnock(float val)  { knock = val; }
        void setDrop(float val)   { drop = val; }
        void setDecay(float val)  { decay = val; }
        void setGrowl(float val)  { growl = val; }
        void setBite(float val)   { bite = val; }
        void setDrive(float val)  { drive = val; }
        void setSlide(float val)  { slide = val; }
        void setTone(float val)   { tone = val; }

    private:
        double sampleRate = 44100.0;
        bool active = false;
        int currentNote = -1;
        float noteVelocity = 0.8f;

        // Phase tracking
        double bodyPhase = 0.0;
        double subPhase = 0.0;
        double transientPhase = 0.0;
        int transientSamplesRemaining = 0;

        PitchEnvelope pitchEnv;

        // Macros
        float weight = 0.55f;
        float knock  = 0.60f;
        float drop   = 0.50f;
        float decay  = 0.45f;
        float growl  = 0.35f;
        float bite   = 0.50f;
        float drive  = 0.30f;
        float slide  = 0.40f;
        float tone   = 0.60f;

        // Decay envelope progress
        float envProgress = 0.0f;
        float envDecaySamples = 44100.0f;

        // Filter
        juce::dsp::StateVariableTPTFilter<float> filter;
    };
}
