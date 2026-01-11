# 🌍 STREAM History - Simulation Géopolitique

Un jeu de stratégie textuel web où vous gérez un pays à travers l'histoire, assisté par une IA (Ollama).

![Game Screenshot](https://via.placeholder.com/800x400?text=STREAM+History)

## 🎮 Concept

1. **Sélectionnez** un pays sur la carte du monde interactive
2. **Choisissez** une date historique (de l'Antiquité à aujourd'hui)
3. **Gérez** votre nation via des choix narratifs générés par IA
4. **Observez** les conséquences de vos décisions sur les statistiques

## 🛠️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Carte | react-leaflet + GeoJSON |
| Backend | Python FastAPI |
| IA | Ollama (local) |
| Base de données | PostgreSQL |

## 📦 Installation

### Prérequis

- Node.js 18+
- Python 3.10+
- PostgreSQL
- Ollama

### 1. Base de données

```bash
# Créer la base de données PostgreSQL
createdb geopolitical_game
```

### 2. Ollama

```bash
# Installer Ollama (https://ollama.ai)
# Démarrer le serveur
ollama serve

# Dans un autre terminal, télécharger un modèle
ollama pull mistral
# ou
ollama pull llama3
```

### 3. Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # macOS/Linux
# ou: venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Copier et configurer .env
cp .env.example .env
# Modifier DATABASE_URL si nécessaire

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev
```

## 🚀 Utilisation

1. Ouvrez http://localhost:5173 dans votre navigateur
2. Cliquez sur un pays sur la carte
3. Sélectionnez une année de départ
4. Cliquez sur "Lancer la partie"
5. Faites vos choix stratégiques !

## 📁 Structure du Projet

```
STREAM-History/
├── backend/
│   ├── main.py              # Application FastAPI
│   ├── database.py          # Configuration PostgreSQL
│   ├── models.py            # Modèles SQLAlchemy
│   ├── schemas.py           # Schémas Pydantic
│   ├── ollama_service.py    # Service IA
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── WorldMap.jsx
│   │   │   ├── GameSetup.jsx
│   │   │   └── GameInterface.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🎯 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health/ollama` | Vérifier si Ollama est actif |
| POST | `/start_game` | Démarrer une nouvelle partie |
| POST | `/make_decision` | Soumettre un choix |
| GET | `/games/{id}` | Récupérer l'état d'une partie |
| GET | `/games` | Lister les parties récentes |

## ⚠️ Notes

- **Frontières historiques**: Le jeu utilise les frontières modernes pour la sélection, mais l'IA adapte son contexte narratif à l'époque choisie.
- **Performances**: La génération IA peut prendre quelques secondes selon votre matériel et le modèle Ollama utilisé.

## 📄 License

MIT
