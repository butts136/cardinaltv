<<<<<<< HEAD
# Cardinal TV – Serveur de diaporama local

Application web légère en Python 3 (Flask) pour téléverser et organiser des médias (images, vidéos, PDF et autres fichiers) puis les afficher en boucle sur un navigateur (ex. Amazon Silk sur Fire TV Stick).

## Installation rapide

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

> Sur macOS/Linux adaptez les chemins de l'environnement virtuel (`source .venv/bin/activate`).

## Lancement

```bash
python app.py
```

Le serveur écoute sur `http://0.0.0.0:39010`. Depuis la Fire TV, ouvrez la page dans Amazon Silk via l'adresse du PC suivie de `:39010`.

## Fonctionnalités principales

- Téléversement de fichiers multiples vers `data/images/`.
- Gestion de playlist : activation/désactivation, durée, dates de début/fin (heure du Québec), suppression, réorganisation et configuration du nombre de passages à sauter par média.
- Conversion automatique des PDF et DOCX en pages images (avec repli texte converti en image) pour un affichage page par page dans le diaporama.
- Lien direct vers le mode diaporama plein écran (`/slideshow`) avec tentative d'empêcher la mise en veille et lecture audio respectant le réglage muet défini pour chaque vidéo.
- Stockage des métadonnées dans `data/media.json`.

## Organisation des fichiers

- `app.py` — Serveur Flask et API.
- `static/index.html` — Interface de gestion.
- `static/slideshow.html` — Mode diaporama.
- `static/js/` — Scripts front-end.
- `static/css/styles.css` — Styles.
- `data/images/` — Médias téléversés.

## Notes

- Le diaporama tente de conserver l'écran éveillé (Wake Lock) lorsque le navigateur le permet et affiche l'heure courante du Québec ainsi que le logo Cardinal en superposition discrète.
- Les conversions DOCX→PDF→images nécessitent Microsoft Word (Windows) ou LibreOffice ; en cas d'échec, le contenu est affiché sous forme de texte découpé en pages.
- Les dépendances Python `docx2pdf`, `python-docx`, `PyMuPDF`, `PyPDF2` et `Pillow` sont utilisées pour préparer les documents.
## Mode production

Depuis cette version, l'application utilise automatiquement le serveur WSGI Waitress (inclus dans `requirements.txt`) lorsqu'aucun mode debug n'est activé. Waitress impose une taille maximale au pool de threads, ce qui évite les plantages de type `RuntimeError: can't start new thread` lorsque de nombreuses connexions restent ouvertes.

- Désactivez le mode debug en omettant la variable d'environnement `CARDINALTV_DEBUG` (comportement par défaut avec le service systemd).
- Ajustez les paramètres si besoin via :
- `CARDINALTV_WAITRESS_THREADS` (par défaut `min(64, max(12, 2 * cœurs CPU))`) ;
- `CARDINALTV_WAITRESS_CONNECTION_LIMIT` (`max(threads * 8, 128)` par défaut) ;
- `CARDINALTV_WAITRESS_CHANNEL_TIMEOUT` (90 secondes par défaut) ;
- `CARDINALTV_WAITRESS_BACKLOG` (512 par défaut).

Si Waitress n'est pas disponible, `app.py` repasse sur le serveur Flask mono-thread et affiche un avertissement.

=======
# Cardinal TV – Serveur de diaporama local

Application web légère en Python 3 (Flask) pour téléverser et organiser des médias (images, vidéos, PDF et autres fichiers) puis les afficher en boucle sur un navigateur (ex. Amazon Silk sur Fire TV Stick).

## Installation rapide

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

> Sur macOS/Linux adaptez les chemins de l'environnement virtuel (`source .venv/bin/activate`).

## Lancement

```bash
python app.py
```

Le serveur écoute sur `http://0.0.0.0:39010`. Depuis la Fire TV, ouvrez la page dans Amazon Silk via l'adresse du PC suivie de `:39010`.

## Fonctionnalités principales

- Téléversement de fichiers multiples vers `data/images/`.
- Gestion de playlist : activation/désactivation, durée, dates de début/fin (heure du Québec), suppression, réorganisation et configuration du nombre de passages à sauter par média.
- Conversion automatique des PDF et DOCX en pages images (avec repli texte converti en image) pour un affichage page par page dans le diaporama.
- Lien direct vers le mode diaporama plein écran (`/slideshow`) avec tentative d'empêcher la mise en veille et lecture audio respectant le réglage muet défini pour chaque vidéo.
- Stockage des métadonnées dans `data/media.json`.

## Organisation des fichiers

- `app.py` — Serveur Flask et API.
- `static/index.html` — Interface de gestion.
- `static/slideshow.html` — Mode diaporama.
- `static/js/` — Scripts front-end.
- `static/css/styles.css` — Styles.
- `data/images/` — Médias téléversés.

## Notes

- Le diaporama tente de conserver l'écran éveillé (Wake Lock) lorsque le navigateur le permet et affiche l'heure courante du Québec ainsi que le logo Cardinal en superposition discrète.
- Les conversions DOCX→PDF→images nécessitent Microsoft Word (Windows) ou LibreOffice ; en cas d'échec, le contenu est affiché sous forme de texte découpé en pages.
- Les dépendances Python `docx2pdf`, `python-docx`, `PyMuPDF`, `PyPDF2` et `Pillow` sont utilisées pour préparer les documents.
>>>>>>> 32ed2256021277d832bf4e4fa3f026e9f03f644f
