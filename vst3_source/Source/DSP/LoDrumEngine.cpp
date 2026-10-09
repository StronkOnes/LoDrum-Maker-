#include "LoDrumEngine.h"

namespace DSP
{
    LoDrumEngine::LoDrumEngine() {}

    void LoDrumEngine::prepare(double sampleRate, int samplesPerBlock)
    {
        currentSampleRate = sampleRate;
        for (auto& v : voices)
        {
            v.prepare(sampleRate);
        }

        juce::dsp::ProcessSpec spec;
        spec.sampleRate = sampleRate;
        spec.maximumBlockSize = static_cast<juce::uint32>(samplesPerBlock);
        spec.numChannels = 2;

        masterLimiter.prepare(spec);
        masterLimiter.setThreshold(0.0f);
        masterLimiter.setRelease(50.0f);
    }

    void LoDrumEngine::reset()
    {
        allNotesOff();
        masterLimiter.reset();
    }

    void LoDrumEngine::process(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
    {
        for (const auto metadata : midiMessages)
        {
            const auto msg = metadata.getMessage();
            if (msg.isNoteOn())
            {
                noteOn(msg.getChannel(), msg.getNoteNumber(), msg.getFloatVelocity());
            }
            else if (msg.isNoteOff())
            {
                noteOff(msg.getChannel(), msg.getNoteNumber(), msg.getFloatVelocity());
            }
            else if (msg.isAllNotesOff())
            {
                allNotesOff();
            }
        }

        const int numSamples = buffer.getNumSamples();
        buffer.clear();

        for (auto& v : voices)
        {
            if (v.isActive())
            {
                v.renderNextBlock(buffer, 0, numSamples);
            }
        }

        buffer.applyGain(masterVolume);

        juce::dsp::AudioBlock<float> block(buffer);
        juce::dsp::ProcessContextReplacing<float> context(block);
        masterLimiter.process(context);
    }

    void LoDrumEngine::noteOn(int /*channel*/, int midiNoteNumber, float velocity, bool slide)
    {
        // Find inactive voice or steal oldest
        Voice* targetVoice = nullptr;
        for (auto& v : voices)
        {
            if (!v.isActive())
            {
                targetVoice = &v;
                break;
            }
        }
        if (!targetVoice)
        {
            targetVoice = &voices[0]; // Simple voice steal
        }

        targetVoice->startNote(midiNoteNumber, velocity, slide ? lastNoteNumber : -1);
        lastNoteNumber = midiNoteNumber;
    }

    void LoDrumEngine::noteOff(int /*channel*/, int midiNoteNumber, float /*velocity*/, bool /*allowTailOff*/)
    {
        for (auto& v : voices)
        {
            if (v.isActive() && v.getCurrentlyPlayingNote() == midiNoteNumber)
            {
                v.stopNote();
            }
        }
    }

    void LoDrumEngine::allNotesOff()
    {
        for (auto& v : voices)
        {
            v.stopNote();
        }
    }

    void LoDrumEngine::setWeight(float val) { for (auto& v : voices) v.setWeight(val); }
    void LoDrumEngine::setKnock(float val)  { for (auto& v : voices) v.setKnock(val); }
    void LoDrumEngine::setDrop(float val)   { for (auto& v : voices) v.setDrop(val); }
    void LoDrumEngine::setDecay(float val)  { for (auto& v : voices) v.setDecay(val); }
    void LoDrumEngine::setGrowl(float val)  { for (auto& v : voices) v.setGrowl(val); }
    void LoDrumEngine::setBite(float val)   { for (auto& v : voices) v.setBite(val); }
    void LoDrumEngine::setDrive(float val)  { for (auto& v : voices) v.setDrive(val); }
    void LoDrumEngine::setSlide(float val)  { for (auto& v : voices) v.setSlide(val); }
    void LoDrumEngine::setTone(float val)   { for (auto& v : voices) v.setTone(val); }
    void LoDrumEngine::setOutput(float val) { masterVolume = val; }
}
