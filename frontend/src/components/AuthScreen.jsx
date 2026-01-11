import { useState } from 'react';

function AuthScreen({ onLogin, onSkip }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Une erreur est survenue');
            }

            // Save token and user info
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token || '');

            onLogin(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 animate-float">🌍</div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent animate-gradient-x">
                        STREAM History
                    </h1>
                    <p className="text-text-muted mt-2">Simulation Géopolitique</p>
                </div>

                {/* Auth Card */}
                <div className="glass rounded-2xl p-8 border border-white/10">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${isLogin
                                    ? 'bg-accent text-white'
                                    : 'bg-white/5 text-text-muted hover:bg-white/10'
                                }`}
                        >
                            Connexion
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${!isLogin
                                    ? 'bg-accent text-white'
                                    : 'bg-white/5 text-text-muted hover:bg-white/10'
                                }`}
                        >
                            Inscription
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">
                                Nom d'utilisateur
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent transition-colors"
                                placeholder="Entrez votre pseudo"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {!isLogin && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-text-muted mb-2">
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-accent to-orange-500 rounded-xl font-semibold text-lg hover:from-orange-500 hover:to-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Chargement...
                                </span>
                            ) : (
                                isLogin ? 'Se connecter' : "S'inscrire"
                            )}
                        </button>
                    </form>

                    {/* Skip button */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={onSkip}
                            className="text-text-muted hover:text-white transition-colors text-sm"
                        >
                            Continuer en tant qu'invité →
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-text-muted/50 text-sm">
                    Propulsé par Ollama AI
                </p>
            </div>
        </div>
    );
}

export default AuthScreen;
