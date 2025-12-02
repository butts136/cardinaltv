# Cardinal TV – Serveur de diaporama local

Application web complète en Python 3 (Flask) permettant de téléverser, organiser et diffuser des médias (images, vidéos, PDF, documents) en boucle sur un écran de télévision via un navigateur web (Amazon Silk sur Fire TV Stick, Chromium sur Raspberry Pi, etc.).

---

## Table des matières

1. [Description du projet](#description-du-projet)
2. [Architecture technique](#architecture-technique)
3. [Installation et déploiement local](#installation-et-déploiement-local)
4. [Fonctionnalités principales](#fonctionnalités-principales)
5. [Diapositives automatiques](#diapositives-automatiques)
   - [Anniversaire](#diapositive-anniversaire)
   - [Changement d'heure](#diapositive-changement-dheure)
   - [Noël](#diapositive-noël)
   - [Notre Équipe](#diapositive-notre-équipe)
6. [Navigation et interface](#navigation-et-interface)
7. [Format des données](#format-des-données)
8. [Développement et extension](#développement-et-extension)
   - [Ajouter une nouvelle fête](#ajouter-une-nouvelle-fête)
   - [Template de diapositive](#template-de-diapositive)
9. [Tests et vérification](#tests-et-vérification)
10. [Mode production](#mode-production)
11. [Dépendances](#dépendances)

---

## Description du projet

Cardinal TV est un système d'affichage numérique conçu pour diffuser du contenu sur des écrans de télévision dans un environnement professionnel. L'application permet :

- **Téléversement de médias** : Images, vidéos, PDF, documents Word
- **Gestion de playlist** : Ordre, durée, activation/désactivation, dates de début/fin
- **Diapositives automatiques** : Anniversaires, changements d'heure, fêtes (Noël), présentation d'équipe
- **Conversion automatique** : PDF et DOCX convertis en images pour un affichage optimal
- **Prévention de veille** : Mécanismes Wake Lock et fallback vidéo pour maintenir l'écran actif

---

## Architecture technique

```
cardinaltv/
├── app.py                     # Serveur Flask (backend API + routes)
├── requirements.txt           # Dépendances Python
├── README.md                  # Documentation
├── data/                      # Données persistantes (créé au runtime)
│   ├── media.json            # Métadonnées des médias
│   ├── settings.json         # Paramètres globaux
│   ├── employees.json        # Liste des employés
│   ├── images/               # Médias téléversés
│   ├── team_backgrounds/     # Arrière-plans Notre Équipe
│   ├── birthday_backgrounds/ # Arrière-plans Anniversaire
│   ├── time_change_backgrounds/ # Arrière-plans Changement d'heure
│   ├── christmas_backgrounds/   # Arrière-plans Noël
│   └── powerpoint/           # Présentations PowerPoint
├── frontend/
│   ├── templates/            # Templates Jinja2
│   │   ├── base.html        # Template de base avec navigation
│   │   ├── index.html       # Page d'accueil
│   │   ├── slideshow.html   # Mode diaporama plein écran
│   │   ├── birthday.html    # Page Anniversaire
│   │   ├── time_change.html # Page Changement d'heure
│   │   ├── christmas.html   # Page Noël
│   │   ├── employees.html   # Page Employés
│   │   ├── team.html        # Page Notre Équipe
│   │   └── partials/        # Composants réutilisables
│   └── static/
│       ├── css/
│       │   └── styles.css   # Styles globaux
│       ├── js/
│       │   ├── app.js       # Logique du panneau de contrôle
│       │   └── slideshow.js # Logique du diaporama
│       └── img/             # Assets statiques (logos, icônes)
└── scripts/                  # Scripts utilitaires
```

### Composants principaux

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Backend API | `app.py` | Serveur Flask, routes REST, gestion des fichiers |
| Interface admin | `frontend/static/js/app.js` | Panneau de contrôle, prévisualisations |
| Diaporama | `frontend/static/js/slideshow.js` | Lecture en boucle, animations |
| Templates | `frontend/templates/` | Pages HTML avec Jinja2 |

### Flux d'exécution

1. **Démarrage** : Flask charge les données depuis `data/` et expose l'API sur le port 39010
2. **Interface admin** : L'utilisateur accède au panneau via `http://[IP]:39010`
3. **Configuration** : Téléversement de médias, gestion des employés, paramétrage des slides
4. **Diaporama** : Accès via `/slideshow`, lecture automatique des médias actifs

---

## Installation et déploiement local

### Prérequis

- Python 3.9+
- pip (gestionnaire de paquets Python)
- Optionnel : LibreOffice (pour conversion DOCX→PDF sur Linux/macOS)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/butts136/cardinaltv.git
cd cardinaltv

# Créer un environnement virtuel
python -m venv .venv

# Activer l'environnement
# Windows :
.venv\Scripts\activate
# Linux/macOS :
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Lancement

```bash
python app.py
```

Le serveur démarre sur `http://0.0.0.0:39010`.

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `CARDINALTV_DEBUG` | Active le mode debug Flask | `false` |
| `CARDINALTV_PORT` | Port d'écoute | `39010` |
| `CARDINALTV_WAITRESS_THREADS` | Threads Waitress | Auto-calculé |
| `CARDINALTV_WAITRESS_CONNECTION_LIMIT` | Connexions max | Auto-calculé |
| `CARDINALTV_WAITRESS_CHANNEL_TIMEOUT` | Timeout connexion (s) | `90` |
| `CARDINALTV_WAITRESS_BACKLOG` | Backlog connexions | `512` |

---

## Fonctionnalités principales

### Gestion des médias

- **Téléversement multiple** : Glisser-déposer ou sélection de fichiers
- **Formats supportés** : Images (JPEG, PNG, GIF, WebP, SVG), Vidéos (MP4, MOV, WebM), PDF, DOCX
- **Conversion automatique** : PDF et DOCX convertis en images page par page

### Playlist

- **Ordre personnalisable** : Réorganisation par glisser-déposer ou boutons
- **Programmation** : Dates de début et fin d'affichage (fuseau Québec)
- **Contrôle de visibilité** : Activation/désactivation individuelle
- **Durée configurable** : Par média ou durée vidéo native
- **Sauts de rotation** : Afficher un média tous les N passages

### Diaporama

- **Plein écran automatique** : Activation au démarrage
- **Prévention de veille** : Wake Lock API + fallback vidéo canvas
- **Transitions fluides** : Entre médias de différents types
- **Horloge overlay** : Affichage de l'heure du Québec (optionnel)

---

## Diapositives automatiques

Les diapositives automatiques sont des slides générées dynamiquement en fonction de dates, d'événements ou de données. Elles s'insèrent dans la playlist à une position configurable.

### Diapositive Anniversaire

**Objectif** : Afficher une annonce pour les anniversaires des employés.

**Comportement** :
- Affiche l'anniversaire N jours avant (par défaut 3 jours)
- Trois variantes : "Avant" (compte à rebours), "Jour J", "Week-end" (si l'anniversaire tombe un jour fermé)
- Gestion des jours d'ouverture : déplace l'annonce au dernier jour ouvert

**Variables disponibles** :
- `[name]` : Prénom/nom de la personne
- `[days]` : Jours restants avant l'anniversaire
- `[day_label]` : "jour" ou "jours" selon le compte
- `[birthday_weekday]` : Jour de l'anniversaire (ex. Dimanche)
- `[date]` : Date de l'anniversaire (ex. 4 juin 2025)

**Configuration** :
- Activation/désactivation globale
- Durée d'affichage
- Arrière-plan personnalisé (image ou vidéo)
- Textes multiples avec options de style (police, taille, couleur, position)

### Diapositive Changement d'heure

**Objectif** : Annoncer le prochain changement d'heure (été/hiver).

**Comportement** :
- Récupère automatiquement les dates de changement d'heure via API
- Affiche N jours avant le changement (configurable, défaut 7 jours)
- Indique la direction (avancer/reculer) et les fuseaux horaires

**Variables disponibles** :
- `[change_weekday]` : Jour de la semaine (ex. dimanche)
- `[change_date]` : Date complète (ex. 3 mars 2025)
- `[change_time]` : Heure locale du changement (ex. 02:00)
- `[direction_verb]` : "avancer" ou "reculer"
- `[offset_hours]` : Décalage en heures (ex. 1)
- `[offset_from]` / `[offset_to]` : Offsets de départ et d'arrivée
- `[days_until]` / `[days_left]` : Jours restants
- `[days_label]` : "jour" ou "jours"
- `[season_label]` : Libellé saison avec préposition (d'été / d'hiver)
- `[seasons]` : Saison seule (été ou hiver)

**Configuration** :
- Nombre de jours avant l'affichage
- Durée d'affichage
- Arrière-plan personnalisé
- Textes configurables avec styles

### Diapositive Noël

**Objectif** : Afficher une annonce festive pour la période de Noël.

**Comportement** :
- S'active N jours avant le 25 décembre (configurable, défaut 25 jours = 1er décembre)
- Affiche un compte à rebours jusqu'à Noël
- Désactivation automatique après le 25 décembre

**Variables disponibles** :
- `[days_until]` / `[days_left]` : Jours restants avant Noël
- `[days_label]` : "jour" ou "jours" selon le compte
- `[christmas_date]` : Date de Noël (25 décembre XXXX)
- `[christmas_weekday]` : Jour de la semaine de Noël
- `[year]` : Année en cours

**Configuration** :
- Jours avant le début de l'affichage
- Durée d'affichage
- Arrière-plan personnalisé (image ou vidéo)
- Textes multiples avec options complètes de style

### Diapositive Notre Équipe

**Objectif** : Présenter les membres de l'équipe avec animation défilante.

**Comportement** :
- Affiche les fiches employés en défilement vertical
- Animation fluide avec titre optionnel
- Durée configurable par fiche

**Configuration** :
- Activation/désactivation
- Durée minimum par fiche
- Arrière-plan personnalisé
- Titre avec options de style

---

## Navigation et interface

### Structure du panneau de contrôle

```
┌─────────────────────────────────────────────────────┐
│ Barre latérale            │ Contenu principal       │
├───────────────────────────┼─────────────────────────┤
│ • Accueil                 │                         │
│                           │                         │
│ Diaporama                 │  (Contenu de la page    │
│   └─ Vue générale         │   sélectionnée)         │
│      ├─ Téléversement     │                         │
│      ├─ Playlist          │                         │
│      ├─ Employés          │                         │
│      ├─ Notre Équipe      │                         │
│      └─ Fêtes             │                         │
│         ├─ Anniversaire   │                         │
│         ├─ Changement     │                         │
│         │   d'heure       │                         │
│         └─ Noël           │                         │
│                           │                         │
│ Ressources                │                         │
│   └─ PowerPoint           │                         │
└───────────────────────────┴─────────────────────────┘
```

### Sous-menu Fêtes

Les diapositives liées aux fêtes et événements calendaires sont regroupées dans la sous-catégorie **Fêtes** :
- Anniversaire
- Changement d'heure
- Noël

Cette organisation facilite la navigation et la gestion des slides événementielles.

---

## Format des données

### media.json

```json
{
  "id": "uuid-unique",
  "filename": "image.jpg",
  "original_name": "Mon image.jpg",
  "mimetype": "image/jpeg",
  "size": 12345,
  "duration": 10,
  "enabled": true,
  "order_index": 0,
  "start_at": "2025-01-01T00:00:00",
  "end_at": null,
  "skip_rounds": 0,
  "muted": false
}
```

### settings.json

```json
{
  "overlay": {
    "enabled": true,
    "mode": "clock",
    "height_vh": 5,
    "background_color": "#f0f0f0",
    "text_color": "#111111"
  },
  "birthday_slide": {
    "enabled": false,
    "duration": 12,
    "days_before": 3,
    "open_days": { "monday": true, ... }
  },
  "time_change_slide": {
    "enabled": false,
    "duration": 12,
    "days_before": 7
  },
  "christmas_slide": {
    "enabled": false,
    "duration": 12,
    "days_before": 25
  },
  "team_slide": {
    "enabled": false,
    "duration": 10,
    "card_min_duration": 6
  }
}
```

---

## Développement et extension

### Ajouter une nouvelle fête

Pour ajouter une nouvelle diapositive de fête (ex. Halloween, Saint-Valentin), suivez ce template :

1. **Backend (app.py)** :
   - Ajouter les constantes DEFAULT_*_SETTINGS
   - Créer les routes API `/api/[fete]-slide/*`
   - Ajouter la gestion dans les settings

2. **Template HTML** :
   - Créer `frontend/templates/[fete].html` (hérite de `diaporama_base.html`)
   - Créer `frontend/templates/partials/[fete]_section.html`

3. **JavaScript (app.js)** :
   - Ajouter les sélecteurs et variables
   - Implémenter les fonctions de rendu et sauvegarde

4. **JavaScript (slideshow.js)** :
   - Ajouter la détection dans `detectMediaKind()`
   - Implémenter `render[Fete]Slide()`
   - Ajouter dans `injectAutoSlidesIntoPlaylist()`
   - Ajouter le cas dans `showMedia()`

5. **Navigation** :
   - Ajouter la route dans `app.py`
   - Ajouter le lien dans `base.html` (sous-menu Fêtes)

### Template de diapositive

Structure minimale pour une nouvelle slide de fête :

```javascript
// Dans slideshow.js

const DEFAULT_[FETE]_SLIDE = {
  enabled: false,
  order_index: 0,
  duration: 12,
  background_path: null,
  background_url: null,
  background_mimetype: null,
  days_before: 7,  // Jours avant la fête
  title_text: "Titre par défaut",
  lines: [
    { text: "Ligne 1", options: { font_size: 48, color: "#ffffff" } }
  ]
};

const build[Fete]SlideItem = () => ({
  id: "[FETE]_SLIDE_ID",
  [fete]_slide: true,
  original_name: "[Fête]",
  // ... autres propriétés
});

const render[Fete]Slide = (item) => {
  // Implémenter le rendu
};
```

---

## Tests et vérification

### Tests manuels

1. **Démarrer le serveur** :
   ```bash
   python app.py
   ```

2. **Vérifier l'interface** :
   - Accéder à `http://localhost:39010`
   - Naviguer dans toutes les sections

3. **Tester les diapositives** :
   - Activer chaque type de slide (Anniversaire, Changement d'heure, Noël)
   - Vérifier l'aperçu dans le panneau de contrôle
   - Lancer le diaporama et observer le rendu

4. **Vérifier la navigation** :
   - Cliquer sur tous les liens du menu latéral
   - Vérifier le sous-menu Fêtes
   - Tester l'accessibilité clavier

### Script de vérification

```bash
# Vérifier que le serveur démarre correctement
python -c "import app; print('OK: app.py importable')"

# Vérifier les dépendances
python -c "import flask, waitress, fitz, PIL; print('OK: dépendances présentes')"

# Tester l'API (nécessite curl et serveur démarré)
curl -s http://localhost:39010/api/settings | python -c "import sys,json; json.load(sys.stdin); print('OK: API settings')"
curl -s http://localhost:39010/api/media | python -c "import sys,json; json.load(sys.stdin); print('OK: API media')"
```

---

## Mode production

L'application utilise automatiquement **Waitress** (serveur WSGI) en mode production pour de meilleures performances et stabilité.

### Configuration recommandée

```bash
# Désactiver le debug (production)
unset CARDINALTV_DEBUG

# Lancer le serveur
python app.py
```

### Service systemd (Linux)

```ini
[Unit]
Description=Cardinal TV
After=network.target

[Service]
Type=simple
User=cardinaltv
WorkingDirectory=/opt/cardinaltv
ExecStart=/opt/cardinaltv/.venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## Dépendances

| Paquet | Version | Usage |
|--------|---------|-------|
| Flask | ≥3.0 | Framework web |
| Waitress | ≥2.1 | Serveur WSGI production |
| PyMuPDF (fitz) | ≥1.23.8 | Rendu PDF en images |
| PyPDF2 | ≥3.0.1 | Extraction texte PDF |
| python-docx | ≥1.1.0 | Lecture documents Word |
| docx2pdf | ≥0.1.8 | Conversion DOCX→PDF |
| Pillow | ≥9.5.0 | Manipulation images |

---

## Licence

Ce projet est destiné à un usage interne. Consultez le propriétaire du dépôt pour les conditions d'utilisation.
