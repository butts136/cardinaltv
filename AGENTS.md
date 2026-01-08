# Consignes pour agents IA (Cardinal TV)

## Live‑editor (éditeur de diapositive) — composant central

Le projet utilise un **live‑editor standalone** pour l’édition d’arrière‑plan et de textes des diapositives.  
Toute nouvelle fonctionnalité liée à l’édition de diapositive doit **réutiliser et étendre** ce live‑editor, et non créer un autre éditeur parallèle.

### Fichiers à connaître
- UI Jinja : `frontend/templates/partials/live_editor_section.html`
- Logique JS : `frontend/static/js/live_editor.js`
- Styles : `frontend/static/css/media_editor.css`
- Gestion des customs : `frontend/templates/custom_slides.html`, `frontend/static/js/custom_slides.js`

### Contrat d’intégration
Pour intégrer le live‑editor sur une page de diapositive :
1. Définir les variables Jinja avant l’include :
   - `editor_prefix` (obligatoire) : identifiant court unique de la diapo (ex. `time-change`, `birthday`).
   - `editor_kind` (obligatoire) : clé logique utilisée par `live_editor.js` pour choisir les endpoints/settings (ex. `time_change`, `birthday`, `christmas`, `test`).
   - `editor_slide_id` (obligatoire si `editor_kind="custom"`) : id de la diapo personnalisée pour router les endpoints `/api/custom-slides/<id>`.
   - `editor_title`, `editor_description` (optionnels).
   - `editor_tokens` (optionnel) : liste de variables affichées dans le modal.
   - `editor_variant` (optionnel) : utile pour les variantes (ex. birthday).
2. Inclure le partial :
   - `{% include "partials/live_editor_section.html" %}`
3. Charger le script :
   - `<script src="{{ url_for('static', filename='js/live_editor.js') }}"></script>`

### IDs internes et préfixes
Le partial construit un préfixe interne :
- `id_prefix = editor_id_prefix or (editor_prefix ~ "-editor")`
Tous les IDs de l’éditeur sont formés ainsi :
- `${id_prefix}-background-input`, `${id_prefix}-preview-stage`, `${id_prefix}-text-add`, etc.
`live_editor.js` lit `data-editor-prefix="{{ id_prefix }}"` et ne doit **jamais** dépendre d’IDs hardcodés.

Ne pas renommer arbitrairement ces IDs sans mettre à jour `live_editor.js`.

### Toggle d’activation
L’éditeur peut afficher un toggle interne :
- variable Jinja `show_enabled_toggle` (défaut `True`).
Pour les pages ayant déjà un bloc “Statut” externe, passer :
- `{% set show_enabled_toggle = False %}`

### Gestion des dates (forcée vs personnalisée)
Certaines diapositives peuvent utiliser :
- une **date forcée** (par défaut),
- ou une **date personnalisée** via un champ de l’éditeur.

Le live‑editor supporte un contrôle optionnel activé par :
- `{% set show_date_control = True %}`

Le backend doit alors gérer et persister, dans le JSON de la diapo associée :
- `use_custom_date: bool` (défaut `False`)
- `custom_date: "YYYY-MM-DD"` (défaut `""`)

Exemple existant : `time_change_slide` (voir `app.py` et l’endpoint `api/time-change-slide/next`).

Si une diapo ne supporte pas ces champs côté serveur, **ne pas** activer `show_date_control`.

### Règles de contribution
- Toujours privilégier le live‑editor pour l’édition texte/fond.
- Éviter toute duplication d’UI ou d’endpoints “legacy”.
- Les nouvelles diapositives personnalisées utilisent `editor_kind="custom"` et les endpoints `/api/custom-slides/*` (ne pas étendre `/api/test/*`).
- Garder l’éditeur **moderne et robuste** : inputs optionnels, fallback sûrs, pas de collision d’IDs.
- Toute amélioration doit conserver la réutilisabilité (préfixes, `editor_kind`, endpoints génériques).
---

## Bandes informatives — système de layout slideshow

### Concept
Le slideshow peut fonctionner en **plein écran** (frame 16:9 à 100%) ou en **mode réduit** avec des **bandes informatives** qui remplissent l'espace libre autour du frame.

```
┌─────────────────────────────────────────────────────────────┐
│                   BANDE HORIZONTALE (top)                   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│    BANDE     │                                              │
│   VERTICALE  │            SLIDESHOW FRAME                   │
│    (left)    │              (16:9 ratio)                    │
│              │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
  Exemple : frame 80% positionné en bas-droite
```

### Architecture

#### Fichiers
- **Backend** : `app.py` — endpoints `/api/info-bands/*`
- **Config** : `data/info_bands/config.json`
- **Page admin** : `frontend/templates/info_bands.html`
- **CSS** : `frontend/static/css/styles.css` (section bandes)
- **JS slideshow** : `frontend/static/js/slideshow.js` (intégration layout)

#### Structure de données (`data/info_bands/config.json`)
```json
{
  "enabled": false,
  "frame": {
    "size": 100,
    "position": "bottom-right"
  },
  "bands": {
    "horizontal": {
      "background": "#1a1a2e",
      "widgets": []
    },
    "vertical": {
      "background": "#1a1a2e",
      "widgets": []
    }
  },
  "widgets": []
}
```

#### Positions possibles du frame
| Valeur | Description |
|--------|-------------|
| `top-left` | Coin supérieur gauche |
| `top-right` | Coin supérieur droit |
| `bottom-left` | Coin inférieur gauche |
| `bottom-right` | Coin inférieur droit |
| `center` | Centré (bandes égales des deux côtés) |

#### Calcul des bandes
- **Frame size** : 50% à 100% (conserve toujours le ratio 16:9)
- Si `position = bottom-right` et `size = 80%` :
  - Bande horizontale : 20% de la hauteur (en haut)
  - Bande verticale : 20% de la largeur (à gauche)

### Widgets (phase future)
Les widgets sont des éléments flottants placés sur les bandes :
- **Horloge** : affiche l'heure actuelle
- **Date** : affiche la date du jour
- **Logo** : image personnalisée
- **Texte défilant** : ticker de messages
- **Météo** : conditions actuelles (si API configurée)

Chaque widget aura :
```json
{
  "id": "uuid",
  "type": "clock|date|logo|ticker|weather",
  "band": "horizontal|vertical",
  "position": { "x": 50, "y": 50 },
  "size": { "width": 200, "height": 100 },
  "config": { ... }
}
```

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/info-bands` | Récupère la configuration complète |
| `POST` | `/api/info-bands` | Met à jour la configuration |
| `GET` | `/api/info-bands/widgets` | Liste les widgets disponibles |
| `POST` | `/api/info-bands/widgets` | Ajoute un widget |
| `DELETE` | `/api/info-bands/widgets/<id>` | Supprime un widget |

### Intégration slideshow

Le fichier `slideshow.js` doit :
1. Charger la config des bandes au démarrage
2. Appliquer le layout CSS dynamiquement
3. Créer les containers pour les bandes si activées
4. Positionner le frame selon la config
5. Rafraîchir périodiquement (pour les widgets dynamiques)

### Règles de contribution
- Le frame slideshow conserve **toujours** son ratio 16:9
- Les bandes sont des conteneurs flexbox qui s'adaptent
- Les widgets sont positionnés en absolu dans leur bande respective
- La configuration est persistée dans `data/info_bands/config.json`
- Le slideshow doit fonctionner normalement si les bandes sont désactivées