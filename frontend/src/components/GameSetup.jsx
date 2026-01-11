import { useState } from 'react';

function GameSetup({ selectedCountry, onStartGame, loading }) {
    const [year, setYear] = useState('1800');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < -3000 || yearNum > 2100) {
            setError('Entrez une année valide (entre -3000 et 2100)');
            return;
        }

        setError('');
        onStartGame(yearNum);
    };

    // Preset historical periods
    const presets = [
        { label: 'Antiquité', year: -500 },
        { label: 'Empire Romain', year: 100 },
        { label: 'Moyen Âge', year: 1200 },
        { label: 'Renaissance', year: 1500 },
        { label: 'Révolution', year: 1789 },
        { label: 'Ère Napoléon', year: 1805 },
        { label: 'Belle Époque', year: 1900 },
        { label: 'Entre-deux-guerres', year: 1930 },
        { label: 'Guerre Froide', year: 1960 },
        { label: 'Moderne', year: 2000 },
    ];

    return (
        <div className="glass rounded-2xl p-6 animate-fade-in">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                    <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedCountry ? selectedCountry.name : 'Sélectionnez un pays'}
                </h2>
                {selectedCountry && (
                    <p className="text-text-muted">Code: {selectedCountry.code}</p>
                )}
            </div>

            {selectedCountry ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Year input */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">
                            Année de départ
                        </label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-white text-lg text-center focus:outline-none focus:border-accent transition-colors"
                            placeholder="Ex: 1789"
                        />
                        {error && (
                            <p className="mt-2 text-red-400 text-sm">{error}</p>
                        )}
                    </div>

                    {/* Preset buttons */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-3">
                            Périodes historiques
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.year}
                                    type="button"
                                    onClick={() => setYear(preset.year.toString())}
                                    className={`px-3 py-2 rounded-lg text-sm transition-all ${parseInt(year) === preset.year
                                            ? 'bg-accent text-white'
                                            : 'bg-background/30 text-text-muted hover:bg-background/50 hover:text-white'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-accent to-orange-500 hover:from-orange-500 hover:to-accent shadow-lg hover:shadow-accent/25 hover:scale-[1.02]'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Génération en cours...
                            </span>
                        ) : (
                            '🎮 Lancer la partie'
                        )}
                    </button>
                </form>
            ) : (
                <div className="text-center py-8">
                    <p className="text-text-muted">
                        Cliquez sur un pays sur la carte pour commencer
                    </p>
                    <div className="mt-6 flex justify-center">
                        <svg className="w-12 h-12 text-accent animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GameSetup;
