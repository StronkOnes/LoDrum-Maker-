#include "PluginProcessor.h"
#include "PluginEditor.h"

LoDrumMakerAudioProcessor::LoDrumMakerAudioProcessor()
    : AudioProcessor(BusesProperties().withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      apvts(*this, nullptr, "Parameters", createParameterLayout())
{
}

LoDrumMakerAudioProcessor::~LoDrumMakerAudioProcessor() {}

juce::AudioProcessorValueTreeState::ParameterLayout LoDrumMakerAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    auto addMacro = [&](const juce::String& id, const juce::String& name, float defaultVal) {
        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{ id, 1 }, name, juce::NormalisableRange<float>(0.0f, 100.0f, 0.1f), defaultVal));
    };

    addMacro("weight", "Weight", 55.0f);
    addMacro("knock",  "Knock",  60.0f);
    addMacro("drop",   "Drop",   50.0f);
    addMacro("decay",  "Decay",  45.0f);
    addMacro("growl",  "Growl",  35.0f);
    addMacro("bite",   "Bite",   50.0f);
    addMacro("drive",  "Drive",  30.0f);
    addMacro("slide",  "Slide",  40.0f);
    addMacro("tone",   "Tone",   60.0f);
    addMacro("output", "Output", 80.0f);

    return { params.begin(), params.end() };
}

void LoDrumMakerAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    engine.prepare(sampleRate, samplesPerBlock);
}

void LoDrumMakerAudioProcessor::releaseResources()
{
    engine.reset();
}

bool LoDrumMakerAudioProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const
{
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo()
        && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono())
        return false;

    return true;
}

void LoDrumMakerAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;

    // Update macros from APVTS
    engine.setWeight(*apvts.getRawParameterValue("weight") / 100.0f);
    engine.setKnock(*apvts.getRawParameterValue("knock") / 100.0f);
    engine.setDrop(*apvts.getRawParameterValue("drop") / 100.0f);
    engine.setDecay(*apvts.getRawParameterValue("decay") / 100.0f);
    engine.setGrowl(*apvts.getRawParameterValue("growl") / 100.0f);
    engine.setBite(*apvts.getRawParameterValue("bite") / 100.0f);
    engine.setDrive(*apvts.getRawParameterValue("drive") / 100.0f);
    engine.setSlide(*apvts.getRawParameterValue("slide") / 100.0f);
    engine.setTone(*apvts.getRawParameterValue("tone") / 100.0f);
    engine.setOutput(*apvts.getRawParameterValue("output") / 100.0f);

    engine.process(buffer, midiMessages);
}

juce::AudioProcessorEditor* LoDrumMakerAudioProcessor::createEditor()
{
    return new LoDrumMakerAudioProcessorEditor(*this);
}

void LoDrumMakerAudioProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void LoDrumMakerAudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState(getXmlFromBinary(data, sizeInBytes));
    if (xmlState != nullptr && xmlState->hasTagName(apvts.state.getType()))
    {
        apvts.replaceState(juce::ValueTree::fromXml(*xmlState));
    }
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new LoDrumMakerAudioProcessor();
}
