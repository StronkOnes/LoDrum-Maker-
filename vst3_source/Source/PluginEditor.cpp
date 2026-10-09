#include "PluginEditor.h"

LoDrumMakerAudioProcessorEditor::LoDrumMakerAudioProcessorEditor(LoDrumMakerAudioProcessor& p)
    : AudioProcessorEditor(&p), processorRef(p)
{
    setSize(920, 540);

    const std::array<juce::String, 10> paramIds = {
        "weight", "knock", "drop", "decay", "growl", "bite", "drive", "slide", "tone", "output"
    };
    const std::array<juce::String, 10> paramNames = {
        "WEIGHT", "KNOCK", "DROP", "DECAY", "GROWL", "BITE", "DRIVE", "SLIDE", "TONE", "OUTPUT"
    };

    for (size_t i = 0; i < 10; ++i)
    {
        auto& slider = macroSliders[i];
        slider.setSliderStyle(juce::Slider::RotaryVerticalDrag);
        slider.setTextBoxStyle(juce::Slider::TextBoxBelow, false, 50, 18);
        slider.setColour(juce::Slider::rotarySliderFillColourId, juce::Colour(0xfff59e0b)); // Amber
        slider.setColour(juce::Slider::rotarySliderOutlineColourId, juce::Colour(0xff1f2432));
        slider.setColour(juce::Slider::thumbColourId, juce::Colour(0xfffbbf24));
        addAndMakeVisible(slider);

        auto& label = macroLabels[i];
        label.setText(paramNames[i], juce::dontSendNotification);
        label.setJustificationType(juce::Justification::centred);
        label.setFont(juce::Font(10.0f, juce::Font::bold));
        label.setColour(juce::Label::textColourId, juce::Colour(0xff94a3b8));
        addAndMakeVisible(label);

        sliderAttachments[i] = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
            processorRef.getAPVTS(), paramIds[i], slider);
    }
}

LoDrumMakerAudioProcessorEditor::~LoDrumMakerAudioProcessorEditor() {}

void LoDrumMakerAudioProcessorEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff0b0c10)); // Charcoal black

    // Header background
    g.setColour(juce::Colour(0xff12141c));
    g.fillRect(0, 0, getWidth(), 60);

    g.setColour(juce::Colour(0xff222736));
    g.drawHorizontalLine(60, 0.0f, static_cast<float>(getWidth()));

    // Title text
    g.setColour(juce::Colours::white);
    g.setFont(juce::Font(18.0f, juce::Font::bold));
    g.drawText("LoDrum Maker", 24, 18, 200, 24, juce::Justification::left);

    g.setColour(juce::Colour(0xfff59e0b));
    g.setFont(juce::Font(11.0f, juce::Font::bold));
    g.drawText("THE PLUGIN FOUNDRY", 200, 22, 180, 20, juce::Justification::left);

    // Subtitle
    g.setColour(juce::Colour(0xff64748b));
    g.setFont(juce::Font(12.0f, juce::Font::plain));
    g.drawText("Original Log Drum Instrument & Pattern Creator", getWidth() - 320, 20, 300, 20, juce::Justification::right);
}

void LoDrumMakerAudioProcessorEditor::resized()
{
    auto area = getLocalBounds().reduced(20);
    area.removeFromTop(60);

    auto macroArea = area.removeFromTop(160);
    const int knobWidth = macroArea.getWidth() / 10;

    for (size_t i = 0; i < 10; ++i)
    {
        auto col = macroArea.removeFromLeft(knobWidth);
        macroLabels[i].setBounds(col.removeFromTop(18));
        macroSliders[i].setBounds(col);
    }
}
