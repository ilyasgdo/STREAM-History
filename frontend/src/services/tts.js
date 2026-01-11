// Text-to-Speech service using Piper TTS backend
// Falls back to Web Speech API if backend unavailable

const API_URL = 'http://localhost:8000';

class TTSService {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.useBackend = true; // Try backend first
    }

    async speak(text, onEnd = null) {
        this.stop();
        this.isPlaying = true;

        try {
            if (this.useBackend) {
                await this.speakWithBackend(text, onEnd);
            } else {
                this.speakWithBrowser(text, onEnd);
            }
        } catch (error) {
            console.warn('Backend TTS failed, falling back to browser:', error);
            this.useBackend = false;
            this.speakWithBrowser(text, onEnd);
        }
    }

    async speakWithBackend(text, onEnd) {
        const response = await fetch(`${API_URL}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`TTS API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        this.currentAudio = new Audio(audioUrl);

        this.currentAudio.onended = () => {
            this.isPlaying = false;
            URL.revokeObjectURL(audioUrl);
            if (onEnd) onEnd();
        };

        this.currentAudio.onerror = (e) => {
            console.error('Audio playback error:', e);
            this.isPlaying = false;
            if (onEnd) onEnd();
        };

        await this.currentAudio.play();
    }

    speakWithBrowser(text, onEnd) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        // Find French voice
        const voices = synth.getVoices();
        const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frenchVoice) {
            utterance.voice = frenchVoice;
        }

        utterance.lang = 'fr-FR';
        utterance.rate = 1.0;

        utterance.onend = () => {
            this.isPlaying = false;
            if (onEnd) onEnd();
        };

        utterance.onerror = () => {
            this.isPlaying = false;
            if (onEnd) onEnd();
        };

        synth.speak(utterance);
    }

    stop() {
        this.isPlaying = false;

        // Stop audio element
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }

        // Stop browser TTS
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    toggle(text, onEnd = null) {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.speak(text, onEnd);
        }
    }
}

// Singleton instance
export const ttsService = new TTSService();
export default ttsService;
