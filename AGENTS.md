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
