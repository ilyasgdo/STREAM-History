import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Check if Ollama is available
 */
export const checkOllamaHealth = async () => {
    try {
        const response = await api.get('/health/ollama');
        return response.data;
    } catch (error) {
        return { status: 'error', message: 'Backend not available' };
    }
};

/**
 * Start a new game
 * @param {string} country - Country name
 * @param {string} countryCode - Country ISO code
 * @param {number} year - Starting year
 */
export const startGame = async (country, countryCode, year) => {
    try {
        const response = await api.post('/start_game', {
            country,
            country_code: countryCode,
            year: parseInt(year),
        });
        return response.data;
    } catch (error) {
        console.error('Error starting game:', error);
        return {
            success: false,
            error: error.response?.data?.detail || 'Erreur de connexion au serveur',
        };
    }
};

/**
 * Make a decision in the game
 * @param {number} gameId - Game ID
 * @param {number} choiceIndex - Selected choice index
 */
export const makeDecision = async (gameId, choiceIndex) => {
    try {
        const response = await api.post('/make_decision', {
            game_id: gameId,
            choice_index: choiceIndex,
        });
        return response.data;
    } catch (error) {
        console.error('Error making decision:', error);
        return {
            success: false,
            error: error.response?.data?.detail || 'Erreur de connexion au serveur',
        };
    }
};

/**
 * Get current game state
 * @param {number} gameId - Game ID
 */
export const getGame = async (gameId) => {
    try {
        const response = await api.get(`/games/${gameId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching game:', error);
        return null;
    }
};

/**
 * List all games
 */
export const listGames = async () => {
    try {
        const response = await api.get('/games');
        return response.data;
    } catch (error) {
        console.error('Error listing games:', error);
        return [];
    }
};

export default api;
