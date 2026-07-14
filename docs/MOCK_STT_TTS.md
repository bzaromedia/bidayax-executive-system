# Mock STT and TTS

## Purpose

Phase 8 includes mock speech recognition and synthesis providers so runtime behavior can be tested without live provider credentials or network calls.

## Mock STT

The mock STT provider accepts text directly when available and returns a deterministic transcript. If no text is supplied, it returns a safe generic transcript for test use.

## Mock TTS

The mock TTS provider returns deterministic `mock-audio://` references derived from text and language. It does not create real audio files.

## Limitations

Mock providers are not production voice. They do not perform live transcription, live synthesis, voice cloning, media streaming, WebRTC, or phone calls.