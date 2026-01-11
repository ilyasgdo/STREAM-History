import { useState } from 'react';
import ttsService from '../services/tts';

function TTSButton({ text, className = '' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (isPlaying) {
            ttsService.stop();
            setIsPlaying(false);
            setIsLoading(false);
        } else {
            setIsLoading(true);
            setIsPlaying(true);
            try {
                await ttsService.speak(text, () => {
                    setIsPlaying(false);
                    setIsLoading(false);
                });
                setIsLoading(false);
            } catch (error) {
                console.error('TTS error:', error);
                setIsPlaying(false);
                setIsLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading && !isPlaying}
            className={`tts-button p-2 rounded-lg transition-all ${isPlaying
                    ? 'bg-accent text-white animate-pulse'
                    : isLoading
                        ? 'bg-white/5 text-text-muted cursor-wait'
                        : 'bg-white/10 text-text-muted hover:bg-white/20 hover:text-white'
                } ${className}`}
            title={isPlaying ? 'Arrêter la lecture' : isLoading ? 'Chargement...' : 'Écouter (voix réaliste)'}
        >
            {isLoading && !isPlaying ? (
                <div className="w-5 h-5 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"></div>
            ) : isPlaying ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h1a1 1 0 011 1v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-4zm5 0a1 1 0 011-1h1a1 1 0 011 1v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-4z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            )}
        </button>
    );
}

export default TTSButton;
