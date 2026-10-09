#include "Voice.h"
#include <cmath>

namespace DSP
{
    Voice::Voice() {}

    void Voice::prepare(double sampleRate)
    {
        this->sampleRate = sampleRate;
        pitchEnv.prepare(sampleRate);

        juce::dsp::ProcessSpec spec;
        spec.sampleRate = sampleRate;
        spec.maximumBlockSize = 512;
        spec.numChannels = 1;

        filter.prepare(spec);
        filter.setType(juce::dsp::StateVariableTPTFilterType::lowpass);
    }

    void Voice::startNote(int midiNoteNumber, float velocity, int previousNoteNumber)
    {
        currentNote = midiNoteNumber;
        noteVelocity = velocity;
        active = true;

        bodyPhase = 0.0;
        subPhase = 0.0;
        transientPhase = 0.0;

        // Pitch Drop or Slide
        float dropSemitones = 6.0f + drop * 36.0f;
        float dropDuration = 0.02f + drop * 0.18f;

        if (previousNoteNumber >= 0)
        {
            // Legato slide
            dropSemitones = static_cast<float>(previousNoteNumber - midiNoteNumber);
            dropDuration = 0.01f + slide * 0.15f;
        }

        pitchEnv.trigger(dropSemitones, dropDuration, 0);

        // Transient samples
        float transDecaySec = 0.008f + knock * 0.045f;
        transientSamplesRemaining = static_cast<int>(transDecaySec * sampleRate);

        // Amplitude Decay Duration
        float decaySec = 0.15f + std::pow(decay, 1.6f) * 1.85f;
        envDecaySamples = static_cast<float>(decaySec * sampleRate);
        envProgress = 0.0f;

        // Setup filter
        float cutoffHz = 400.0f + tone * tone * 12000.0f;
        filter.setCutoffFrequency(cutoffHz);
        filter.setResonance(1.0f + growl * 3.5f);
    }

    void Voice::stopNote()
    {
        active = false;
        currentNote = -1;
    }

    void Voice::renderNextBlock(juce::AudioBuffer<float>& outputBuffer, int startSample, int numSamples)
    {
        if (!active) return;

        auto* leftOut = outputBuffer.getWritePointer(0, startSample);
        auto* rightOut = outputBuffer.getNumChannels() > 1 ? outputBuffer.getWritePointer(1, startSample) : nullptr;

        const double baseFreq = 440.0 * std::pow(2.0, (currentNote - 69.0) / 12.0);
        const double twoPi = juce::MathConstants<double>::twoPi;

        for (int i = 0; i < numSamples; ++i)
        {
            if (!active) break;

            // Pitch envelope
            float pitchOffset = pitchEnv.getNextPitchOffsetSemitones();
            double curFreq = baseFreq * std::pow(2.0, pitchOffset / 12.0);

            // 1. Tuned Body Osc
            float bodySample = static_cast<float>(std::sin(bodyPhase));
            bodyPhase += twoPi * curFreq / sampleRate;
            if (bodyPhase >= twoPi) bodyPhase -= twoPi;

            // 2. Sub Fundamental Osc
            float subSample = static_cast<float>(std::sin(subPhase));
            subPhase += twoPi * (curFreq * 0.5) / sampleRate;
            if (subPhase >= twoPi) subPhase -= twoPi;

            // 3. Transient Knock Click
            float transSample = 0.0f;
            if (transientSamplesRemaining > 0)
            {
                float transTone = 600.0f + bite * 3800.0f;
                transSample = static_cast<float>(std::sin(transientPhase)) * (knock * 0.9f);
                transientPhase += twoPi * transTone / sampleRate;
                if (transientPhase >= twoPi) transientPhase -= twoPi;
                transientSamplesRemaining--;
            }

            // Mix layers
            float subWeight = 0.2f + weight * 0.8f;
            float rawMixed = bodySample + subSample * subWeight + transSample;

            // Amplitude envelope
            float amp = std::exp(-envProgress * 4.0f / (envDecaySamples + 1.0f));
            envProgress += 1.0f;

            if (amp < 0.0005f)
            {
                active = false;
                break;
            }

            // Saturation & Waveshaping
            float saturated = Saturation::processSample(rawMixed * amp * noteVelocity, drive, growl);

            // Resonant Filter
            float filtered = filter.processSample(0, saturated);

            leftOut[i] += filtered;
            if (rightOut) rightOut[i] += filtered;
        }
    }
}
