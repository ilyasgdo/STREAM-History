"""
Text-to-Speech service using Piper TTS
Generates realistic speech locally with French voice
"""
import os
import wave
import io
import subprocess
import tempfile
from pathlib import Path

# Path to the French voice model
TTS_MODEL_DIR = Path(__file__).parent / "tts_models"
FRENCH_MODEL = TTS_MODEL_DIR / "fr_FR-siwis-medium.onnx"


def generate_speech(text: str) -> bytes:
    """
    Generate speech from text using Piper CLI.
    Returns WAV audio bytes.
    """
    if not FRENCH_MODEL.exists():
        raise FileNotFoundError(
            f"French voice model not found at {FRENCH_MODEL}. "
            "Please download it first."
        )
    
    # Create temp file for output
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        output_path = tmp.name
    
    try:
        # Run piper command
        process = subprocess.Popen(
            [
                "piper",
                "--model", str(FRENCH_MODEL),
                "--output_file", output_path
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Send text to piper
        stdout, stderr = process.communicate(input=text.encode("utf-8"), timeout=60)
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            raise RuntimeError(f"Piper TTS failed: {error_msg}")
        
        # Check if output file was created
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError("Piper did not generate audio output")
        
        # Read the generated audio
        with open(output_path, "rb") as f:
            audio_data = f.read()
        
        return audio_data
        
    finally:
        # Clean up temp file
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass


def generate_speech_python(text: str) -> bytes:
    """
    Generate speech using piper-tts Python library directly.
    Returns WAV audio bytes.
    """
    try:
        from piper import PiperVoice
        
        if not FRENCH_MODEL.exists():
            raise FileNotFoundError(f"Model not found: {FRENCH_MODEL}")
        
        # Load voice
        voice = PiperVoice.load(str(FRENCH_MODEL))
        
        # Generate audio samples
        audio_samples = []
        for audio_bytes in voice.synthesize_stream_raw(text):
            audio_samples.append(audio_bytes)
        
        # Combine all samples
        raw_audio = b''.join(audio_samples)
        
        # Create WAV file in memory
        buffer = io.BytesIO()
        
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(voice.config.sample_rate)
            wav_file.writeframes(raw_audio)
        
        buffer.seek(0)
        return buffer.read()
        
    except Exception as e:
        print(f"Python Piper failed: {e}, falling back to CLI")
        # Fallback to CLI if library fails
        return generate_speech(text)


if __name__ == "__main__":
    # Test the TTS
    test_text = "Bonjour, je suis le narrateur de votre simulation historique."
    
    print("Testing Piper TTS...")
    print(f"Model path: {FRENCH_MODEL}")
    print(f"Model exists: {FRENCH_MODEL.exists()}")
    
    if FRENCH_MODEL.exists():
        audio = generate_speech_python(test_text)
        print(f"Generated {len(audio)} bytes of audio")
        
        # Save test file
        with open("test_output.wav", "wb") as f:
            f.write(audio)
        print("Saved to test_output.wav")
    else:
        print("Model not found!")
