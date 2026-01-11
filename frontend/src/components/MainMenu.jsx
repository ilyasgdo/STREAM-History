import { useState, useEffect } from 'react';
import { listGames } from '../services/api';

function MainMenu({ onNewGame, onLoadGame }) {
    const [savedGames, setSavedGames] = useState([]);
    const [showSavedGames, setShowSavedGames] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchSavedGames = async () => {
        setLoading(true);
        const games = await listGames();
        setSavedGames(games);
        setLoading(false);
    };

    const handleShowSaved = () => {
        setShowSavedGames(true);
        fetchSavedGames();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-2xl mx-auto">
                {/* Animated Logo */}
                <div className="mb-8 animate-float">
                    <div className="text-8xl mb-4">🌍</div>
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent animate-gradient-x">
                        STREAM History
                    </h1>
                    <p className="text-xl text-text-muted mt-3">
                        Simulation Géopolitique propulsée par IA
                    </p>
                </div>

                {/* Menu Cards */}
                {!showSavedGames ? (
                    <div className="grid md:grid-cols-2 gap-6 mt-12">
                        {/* New Game */}
                        <button
                            onClick={onNewGame}
                            className="group glass rounded-2xl p-8 text-left hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 border border-white/10 hover:border-accent/50"
                        >
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Nouvelle Partie</h2>
                            <p className="text-text-muted">
                                Choisissez un pays et une époque pour réécrire l'histoire
                            </p>
                            <div className="mt-4 flex items-center text-accent">
                                <span>Commencer</span>
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </button>

                        {/* Load Game */}
                        <button
                            onClick={handleShowSaved}
                            className="group glass rounded-2xl p-8 text-left hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 border border-white/10 hover:border-blue-500/50"
                        >
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💾</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Charger Partie</h2>
                            <p className="text-text-muted">
                                Reprenez une partie sauvegardée là où vous l'avez laissée
                            </p>
                            <div className="mt-4 flex items-center text-blue-400">
                                <span>Voir sauvegardes</span>
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </button>
                    </div>
                ) : (
                    /* Saved Games List */
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Parties Sauvegardées</h2>
                            <button
                                onClick={() => setShowSavedGames(false)}
                                className="px-4 py-2 text-text-muted hover:text-white transition-colors"
                            >
                                ← Retour
                            </button>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="loading-shimmer h-24 rounded-xl"></div>
                                ))}
                            </div>
                        ) : savedGames.length === 0 ? (
                            <div className="glass rounded-xl p-8 text-center">
                                <div className="text-6xl mb-4">📭</div>
                                <p className="text-text-muted">Aucune partie sauvegardée</p>
                                <button
                                    onClick={() => { setShowSavedGames(false); onNewGame(); }}
                                    className="mt-4 px-6 py-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                                >
                                    Créer une nouvelle partie
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {savedGames.map((game) => (
                                    <SavedGameCard
                                        key={game.id}
                                        game={game}
                                        onLoad={() => onLoadGame(game.id)}
                                        onRefresh={fetchSavedGames}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <p className="mt-12 text-sm text-text-muted/50">
                    Propulsé par Ollama AI • Réécrivez l'histoire
                </p>
            </div>
        </div>
    );
}

function SavedGameCard({ game, onLoad, onRefresh }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Supprimer cette partie ?')) return;
        setDeleting(true);
        try {
            await fetch(`http://localhost:8000/games/${game.id}`, { method: 'DELETE' });
            onRefresh();
        } catch (error) {
            console.error('Error deleting game:', error);
        }
        setDeleting(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date inconnue';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="glass rounded-xl p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                    🏛️
                </div>
                <div className="text-left">
                    <h3 className="text-lg font-bold text-white">{game.country}</h3>
                    <p className="text-accent text-sm">Année {game.current_date}</p>
                    <p className="text-text-muted text-xs">{formatDate(game.created_at)}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Supprimer"
                >
                    {deleting ? (
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={onLoad}
                    className="px-5 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors font-medium"
                >
                    Continuer
                </button>
            </div>
        </div>
    );
}

export default MainMenu;
