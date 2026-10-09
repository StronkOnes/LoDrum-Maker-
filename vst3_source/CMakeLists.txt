cmake_minimum_required(VERSION 3.22)
project(LoDrumMaker VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

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
        Source/DSP/Saturation.h
        Source/Sequencer/Pattern.h
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
