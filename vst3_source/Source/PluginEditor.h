#pragma once
#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"

class LoDrumMakerAudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    explicit LoDrumMakerAudioProcessorEditor(LoDrumMakerAudioProcessor&);
    ~LoDrumMakerAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    LoDrumMakerAudioProcessor& processorRef;

    std::array<juce::Slider, 10> macroSliders;
    std::array<juce::Label, 10> macroLabels;
    std::array<std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment>, 10> sliderAttachments;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(LoDrumMakerAudioProcessorEditor)
};
