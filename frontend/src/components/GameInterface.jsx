import { useState } from 'react';
import TTSButton from './TTSButton';

function GameInterface({ gameState, onMakeDecision, loading }) {
    const [selectedChoice, setSelectedChoice] = useState(null);

    if (!gameState) return null;

    const { country, current_date, stats, narrative, choices } = gameState;

    const handleDecision = (choiceIndex) => {
        setSelectedChoice(choiceIndex);
        onMakeDecision(choiceIndex);
    };

    // Stat display configuration
    const statConfig = [
        { key: 'gold', label: 'Or', icon: '💰', color: 'text-yellow-400', bg: 'stat-gold' },
        { key: 'stability', label: 'Stabilité', icon: '⚖️', color: 'text-green-400', bg: 'stat-stability', suffix: '%' },
        { key: 'army', label: 'Armée', icon: '⚔️', color: 'text-red-400', bg: 'stat-army' },
        { key: 'population', label: 'Population', icon: '👥', color: 'text-blue-400', bg: 'stat-population' },
        { key: 'diplomacy', label: 'Diplomatie', icon: '🤝', color: 'text-purple-400', bg: 'stat-diplomacy', suffix: '%' },
    ];

    // Format large numbers
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    };

    // Get risk level styling
    const getRiskStyle = (riskLevel) => {
        switch (riskLevel) {
            case 'low':
                return 'choice-low bg-green-900/20';
            case 'high':
                return 'choice-high bg-red-900/20';
            default:
                return 'choice-medium bg-orange-900/20';
        }
    };

    const getRiskLabel = (riskLevel) => {
        switch (riskLevel) {
            case 'low':
                return '🟢 Faible';
            case 'high':
                return '🔴 Élevé';
            default:
                return '🟡 Moyen';
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{country}</h1>
                        <p className="text-accent text-lg font-semibold">Année {current_date}</p>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full text-accent text-sm">
                            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                            En cours
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-3">
                {statConfig.map((stat) => (
                    <div
                        key={stat.key}
                        className={`stat-card glass rounded-xl p-3 text-center ${stat.bg}`}
                    >
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <div className={`text-lg font-bold ${stat.color}`}>
                            {formatNumber(stats[stat.key])}{stat.suffix || ''}
                        </div>
                        <div className="text-xs text-text-muted">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Narrative */}
            <div className="glass rounded-xl p-5 flex-grow overflow-auto">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>📜</span> Situation actuelle
                    </h3>
                    <TTSButton text={narrative} />
                </div>
                <p className="text-text-main leading-relaxed whitespace-pre-line">
                    {narrative}
                </p>
            </div>

            {/* Choices */}
            <div className="glass rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🎯</span> Vos options
                </h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="loading-shimmer h-16 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {choices.map((choice) => (
                            <button
                                key={choice.index}
                                onClick={() => handleDecision(choice.index)}
                                disabled={loading}
                                className={`w-full text-left p-4 rounded-xl transition-all choice-card ${getRiskStyle(choice.risk_level)} ${selectedChoice === choice.index ? 'ring-2 ring-accent' : ''
                                    } hover:bg-white/5`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-grow">
                                        <p className="text-white font-medium">{choice.text}</p>
                                    </div>
                                    <div className="ml-4 text-sm whitespace-nowrap">
                                        {getRiskLabel(choice.risk_level)}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GameInterface;
