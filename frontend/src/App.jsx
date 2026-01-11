import { useState, useEffect } from 'react';
import WorldMap from './components/WorldMap';
import GameSetup from './components/GameSetup';
import GameInterface from './components/GameInterface';
import MainMenu from './components/MainMenu';
import AuthScreen from './components/AuthScreen';
import { startGame, makeDecision, checkOllamaHealth, getGame } from './services/api';
import './index.css';

function App() {
  // User state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Game state
  const [gamePhase, setGamePhase] = useState('auth'); // 'auth' | 'menu' | 'setup' | 'playing'
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);

  // Check if already logged in
  useEffect(() => {
    if (user) {
      setGamePhase('menu');
    }
  }, []);

  // Check Ollama status on mount
  useEffect(() => {
    const checkHealth = async () => {
      const health = await checkOllamaHealth();
      setOllamaStatus(health);
    };
    checkHealth();
  }, []);

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setError(null);
  };

  // Handle game start
  const handleStartGame = async (year) => {
    if (!selectedCountry) return;

    setLoading(true);
    setError(null);

    const response = await startGame(
      selectedCountry.name,
      selectedCountry.code,
      year
    );

    setLoading(false);

    if (response.success) {
      setGameState(response.game);
      setGamePhase('playing');
    } else {
      setError(response.error || 'Erreur lors du démarrage du jeu');
    }
  };

  // Handle player decision
  const handleMakeDecision = async (choiceIndex) => {
    if (!gameState) return;

    setLoading(true);
    setError(null);

    const response = await makeDecision(gameState.game_id, choiceIndex);

    setLoading(false);

    if (response.success) {
      setGameState(response.game);
    } else {
      setError(response.error || 'Erreur lors de la décision');
    }
  };

  // Go back to menu
  const handleBackToMenu = () => {
    setGamePhase('menu');
    setGameState(null);
    setSelectedCountry(null);
  };

  // Go to setup (new game)
  const handleNewGame = () => {
    setGamePhase('setup');
    setGameState(null);
    setSelectedCountry(null);
  };

  // Load a saved game
  const handleLoadGame = async (gameId) => {
    setLoading(true);
    setError(null);
    const game = await getGame(gameId);
    if (game) {
      setGameState(game);
      setGamePhase('playing');
    } else {
      setError('Impossible de charger la partie');
    }
    setLoading(false);
  };

  // Auth handlers
  const handleLogin = (userData) => {
    setUser(userData);
    setGamePhase('menu');
  };

  const handleSkipAuth = () => {
    setUser({ id: 0, username: 'Invité' });
    setGamePhase('menu');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setGamePhase('auth');
  };

  // Show auth screen if not logged in
  if (gamePhase === 'auth') {
    return <AuthScreen onLogin={handleLogin} onSkip={handleSkipAuth} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">
              🌍 STREAM History
            </h1>
            <span className="hidden md:inline-block px-3 py-1 text-xs bg-accent/20 text-accent rounded-full">
              Simulation Géopolitique
            </span>
          </div>

          {/* Ollama status indicator */}
          <div className="flex items-center gap-3">
            {ollamaStatus && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${ollamaStatus.status === 'ok'
                ? 'bg-green-900/30 text-green-400'
                : 'bg-red-900/30 text-red-400'
                }`}>
                <span className={`w-2 h-2 rounded-full ${ollamaStatus.status === 'ok' ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                {ollamaStatus.status === 'ok' ? 'IA Active' : 'IA Hors ligne'}
              </div>
            )}

            {(gamePhase === 'playing' || gamePhase === 'setup') && (
              <button
                onClick={handleBackToMenu}
                className="px-4 py-2 bg-surface hover:bg-secondary/30 rounded-lg transition-colors text-sm"
              >
                ← Menu principal
              </button>
            )}

            {/* User display */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">
                  👤 {user.username}
                </span>
                {user.id !== 0 && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Déconnexion
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      {gamePhase === 'menu' ? (
        <MainMenu onNewGame={handleNewGame} onLoadGame={handleLoadGame} />
      ) : gamePhase === 'setup' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Map section */}
          <div className="lg:col-span-2">
            <WorldMap
              onCountrySelect={handleCountrySelect}
              selectedCountry={selectedCountry}
            />
          </div>

          {/* Setup panel */}
          <div className="lg:col-span-1">
            <GameSetup
              selectedCountry={selectedCountry}
              onStartGame={handleStartGame}
              loading={loading}
            />
          </div>
        </div>
      ) : (
        <div style={{ height: 'calc(100vh - 140px)' }}>
          <GameInterface
            gameState={gameState}
            onMakeDecision={handleMakeDecision}
            loading={loading}
          />
        </div>
      )}

      {/* Footer */}
      {gamePhase !== 'menu' && (
        <footer className="mt-6 text-center text-text-muted text-sm">
          <p>Propulsé par Ollama AI • STREAM History © 2026</p>
        </footer>
      )}
    </div>
  );
}

export default App;
