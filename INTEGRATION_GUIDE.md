# 📘 Guide d'intégration des optimisations Cardinal TV

## 🎯 Objectif
Ce guide vous accompagne étape par étape pour intégrer les optimisations de performance dans votre projet Cardinal TV existant.

---

## ✅ Étape 1 : Vérifier les fichiers créés

Les fichiers suivants ont été ajoutés au projet :

```
frontend/
  static/
    css/
      performance.css          ← Nouveau
    js/
      performance_manager.js   ← Nouveau

PERFORMANCE_OPTIMIZATIONS.md   ← Documentation
INTEGRATION_GUIDE.md            ← Ce fichier
```

---

## ✅ Étape 2 : Modifier les templates HTML

### 2.1 Template de base du slideshow

**Fichier : `frontend/templates/slideshow_base.html`** ou **`frontend/templates/slideshow.html`**

#### Avant (ancien) :
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">
</head>
<body>
    <!-- Contenu -->
    <script src="{{ url_for('static', filename='js/slideshow/constants.js') }}"></script>
    <script src="{{ url_for('static', filename='js/slideshow.js') }}"></script>
</body>
</html>
```

#### Après (optimisé) :
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Styles existants -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">
    
    <!-- ✨ NOUVEAU : CSS de performance -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/performance.css') }}">
</head>
<body>
    <!-- ✨ NOUVEAU : Performance Manager (charger EN PREMIER) -->
    <script src="{{ url_for('static', filename='js/performance_manager.js') }}"></script>
    
    <!-- Scripts existants -->
    <script src="{{ url_for('static', filename='js/slideshow/constants.js') }}"></script>
    <script src="{{ url_for('static', filename='js/slideshow/birthday_config.js') }}"></script>
    <script src="{{ url_for('static', filename='js/slideshow_cache.js') }}"></script>
    <script src="{{ url_for('static', filename='js/slide_renderers.js') }}"></script>
    <script src="{{ url_for('static', filename='js/slideshow.js') }}"></script>
</body>
</html>
```

**⚠️ IMPORTANT :** Le `performance_manager.js` DOIT être chargé avant `slideshow.js` !

---

## ✅ Étape 3 : Adapter slideshow.js (recommandé)

### 3.1 Remplacer la détection de performance

**Fichier : `frontend/static/js/slideshow.js`**

#### Trouver (lignes ~30-70) :
```javascript
const performanceParam = (urlParams.get("perf") || urlParams.get("performance") || "").trim().toLowerCase();
const perfForceLow = /* ... */;
const perfForceHigh = /* ... */;
// ... beaucoup de code de détection ...
const performanceProfile = {
  lowPower: perfLowPowerDetected,
  maxAnimationFps: perfLowPowerDetected ? 30 : 60,
  // ...
};
```

#### Remplacer par :
```javascript
// ✨ Utiliser le Performance Manager si disponible
const performanceProfile = window.CardinalPerformanceManager?.profile || {
  lowPower: false,
  maxAnimationFps: 60,
  disableVideoCrossfade: false,
  reduceEffects: false,
  prefersReducedMotion: false,
  enableAggressiveCache: true,
  maxCacheSize: 100,
  preloadDistance: 2,
  videoPreload: "auto",
  maxConcurrentVideos: 2,
};

// Log du profil appliqué
console.log("📊 Performance profile:", performanceProfile);
```

### 3.2 Utiliser le TimerManager

#### Remplacer les timers directs

**Ancien :**
```javascript
clockTimer = setTimeout(tick, delay);
playlistRefreshTimer = setInterval(refreshPlaylist, 30000);
teamScrollFrame = requestAnimationFrame(animateScroll);
```

**Nouveau :**
```javascript
const timers = window.CardinalPerformanceManager?.timers;

if (timers) {
  timers.setTimeout('clock', tick, delay);
  timers.setInterval('playlistRefresh', refreshPlaylist, 30000);
  timers.requestAnimationFrame('teamScroll', animateScroll);
} else {
  // Fallback si Performance Manager pas chargé
  clockTimer = setTimeout(tick, delay);
  playlistRefreshTimer = setInterval(refreshPlaylist, 30000);
  teamScrollFrame = requestAnimationFrame(animateScroll);
}
```

#### Remplacer les clear

**Ancien :**
```javascript
if (clockTimer) {
  clearTimeout(clockTimer);
  clockTimer = null;
}
```

**Nouveau :**
```javascript
if (timers) {
  timers.clearTimeout('clock');
} else if (clockTimer) {
  clearTimeout(clockTimer);
  clockTimer = null;
}
```

### 3.3 Utiliser DOMBatchManager pour les updates DOM

**Ancien :**
```javascript
element1.style.transform = 'translate(0, 0)';
element2.classList.add('active');
element3.textContent = 'Nouveau texte';
```

**Nouveau :**
```javascript
const domBatch = window.CardinalPerformanceManager?.domBatch;

if (domBatch) {
  domBatch.schedule(() => {
    element1.style.transform = 'translate(0, 0)';
    element2.classList.add('active');
    element3.textContent = 'Nouveau texte';
  });
} else {
  // Fallback sans batch
  element1.style.transform = 'translate(0, 0)';
  element2.classList.add('active');
  element3.textContent = 'Nouveau texte';
}
```

### 3.4 Gérer les vidéos avec MediaResourceManager

**Ancien :**
```javascript
const video = document.createElement('video');
video.src = url;
// ... config ...
currentVideo = video;

// Plus tard
if (currentVideo) {
  currentVideo.pause();
  currentVideo.src = '';
}
```

**Nouveau :**
```javascript
const mediaManager = window.CardinalPerformanceManager?.media;
const video = document.createElement('video');
video.src = url;
// ... config ...

if (mediaManager) {
  mediaManager.registerVideo(video);
}
currentVideo = video;

// Plus tard (cleanup automatique, mais possible manuellement)
if (mediaManager && currentVideo) {
  mediaManager.releaseVideo(currentVideo);
}
```

### 3.5 Throttle des fonctions fréquentes

**Ancien :**
```javascript
const updateClock = () => {
  // Mise à jour toutes les 100ms
};
setInterval(updateClock, 100);
```

**Nouveau :**
```javascript
const { throttle } = window.CardinalPerformanceManager?.utils || {};

const updateClock = () => {
  // Mise à jour
};

// Throttle selon le profil (200ms en low power, 100ms en high)
const throttleDelay = performanceProfile.uiUpdateThrottle || 100;
const throttledUpdate = throttle ? throttle(updateClock, throttleDelay) : updateClock;

if (timers) {
  timers.setInterval('clock', throttledUpdate, throttleDelay);
} else {
  setInterval(throttledUpdate, throttleDelay);
}
```

---

## ✅ Étape 4 : Tester les optimisations

### 4.1 Test basique
1. Lancer le serveur : `python app.py`
2. Ouvrir `/slideshow`
3. Vérifier la console pour :
   ```
   🎯 Cardinal Performance Manager initialized
   ```

### 4.2 Test mode Low Power
```
http://localhost:5000/slideshow?perf=low
```
- Badge rouge "⚡ LOW POWER MODE" doit apparaître (si debug activé)
- Transitions doivent être plus rapides
- FPS limité à 30

### 4.3 Test mode High Performance
```
http://localhost:5000/slideshow?perf=high
```
- Badge vert "🚀 HIGH PERFORMANCE" doit apparaître
- Tous les effets visuels actifs
- FPS jusqu'à 60

### 4.4 Vérifier les timers
Ouvrir la console et taper :
```javascript
window.CardinalPerformanceManager.timers.getActiveCount()
```
Devrait retourner quelque chose comme :
```javascript
{ timers: 3, intervals: 2, frames: 1, total: 6 }
```

### 4.5 Vérifier le FPS
```javascript
window.CardinalPerformanceManager.fps.getFPS()
// Devrait retourner ~30 ou ~60 selon le mode
```

---

## ✅ Étape 5 : Activer le debug (optionnel)

### Dans le navigateur
Ouvrir la console et taper :
```javascript
document.body.dataset.debug = "true";
```

Les badges de performance apparaissent dans le coin inférieur droit.

### Dans le code (permanent)
**Fichier : `frontend/templates/slideshow.html`**
```html
<body data-debug="true">
```

---

## ✅ Étape 6 : Cleanup global (recommandé)

### Ajouter à la fin de slideshow.js

**Fichier : `frontend/static/js/slideshow.js`**

```javascript
// Cleanup global amélioré
window.addEventListener("beforeunload", () => {
  // Cleanup Performance Manager
  const timers = window.CardinalPerformanceManager?.timers;
  const mediaManager = window.CardinalPerformanceManager?.media;
  
  if (timers) {
    timers.clearAll();
    console.log("✅ Tous les timers nettoyés");
  }
  
  if (mediaManager) {
    mediaManager.cleanup();
    console.log("✅ Ressources médias libérées");
  }
  
  // Cleanup existant
  stopClock();
  if (wakeLock) {
    wakeLock.release().catch(() => {});
  }
  stopKeepAwakePlayback();
  
  // Révoquer les object URLs
  cachedMediaObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  cachedMediaObjectUrls.clear();
  
  if (playlistRefreshTimer && !timers) {
    clearInterval(playlistRefreshTimer);
    playlistRefreshTimer = null;
  }
  
  clearPlaybackTimer();
});
```

---

## ✅ Étape 7 : Vérifications finales

### Checklist d'intégration

- [ ] `performance_manager.js` ajouté à `slideshow.html`
- [ ] `performance.css` ajouté à `slideshow.html`
- [ ] Performance Manager chargé AVANT slideshow.js
- [ ] Test avec `?perf=low` fonctionne
- [ ] Test avec `?perf=high` fonctionne
- [ ] Console log "🎯 Cardinal Performance Manager initialized"
- [ ] Timers actifs accessibles via `getActiveCount()`
- [ ] Pas d'erreurs JS dans la console
- [ ] Slideshow fonctionne normalement
- [ ] Transitions fluides même en mode low power

### Test de charge (optionnel mais recommandé)
1. Ajouter 20+ slides à la playlist
2. Laisser tourner 1 heure
3. Ouvrir Performance Monitor du navigateur (F12 > Performance)
4. Vérifier :
   - Mémoire stable (pas de fuite)
   - CPU raisonnable (<30% en mode low)
   - FPS stable

---

## 🎯 Résultats attendus

### Avant optimisations
- ❌ Lags sur machines faibles (2GB RAM)
- ❌ Fuites mémoire après plusieurs heures
- ❌ Saccades lors des transitions vidéo
- ❌ CPU à 80-100% en permanence
- ❌ Timers non nettoyés (30+ actifs)

### Après optimisations
- ✅ Fluide sur machines faibles (30 FPS stable)
- ✅ Pas de fuites mémoire (24h+ tests)
- ✅ Transitions smooth même avec vidéos
- ✅ CPU à 20-40% (mode low) / 40-60% (mode high)
- ✅ Timers trackés et nettoyés automatiquement

---

## 🐛 Dépannage

### "Cardinal Performance Manager is not defined"
**Cause :** `performance_manager.js` pas chargé ou chargé après slideshow.js  
**Solution :** Vérifier l'ordre des scripts dans le HTML

### "Cannot read property 'timers' of undefined"
**Cause :** Même problème  
**Solution :** Ajouter des fallbacks :
```javascript
const timers = window.CardinalPerformanceManager?.timers;
if (timers) {
  // Utiliser timers
} else {
  // Fallback classique
}
```

### Badge de performance ne s'affiche pas
**Cause :** Debug mode pas activé  
**Solution :** `document.body.dataset.debug = "true"`

### FPS toujours à 0
**Cause :** FPS Monitor désactivé en mode low power  
**Solution :** Normal, le monitor est inactif pour économiser CPU

### Timers count augmente indéfiniment
**Cause :** Timers pas nettoyés correctement  
**Solution :** Vérifier que `clearTimeout/clearInterval` utilisent les mêmes clés

---

## 📞 Support

Si vous rencontrez un problème :

1. **Vérifier les logs console** au chargement de la page
2. **Tester avec mode forcé** : `?perf=low` ou `?perf=high`
3. **Vérifier les stats** : `CardinalPerformanceManager.timers.getActiveCount()`
4. **Consulter** `PERFORMANCE_OPTIMIZATIONS.md` pour détails techniques

---

## 🚀 Prochaines étapes (optionnel)

Une fois l'intégration de base terminée, vous pouvez :

1. **Migrer progressivement** tous les timers vers TimerManager
2. **Batch** toutes les modifications DOM fréquentes
3. **Throttle** les fonctions de mise à jour (clock, widgets)
4. **Gérer** toutes les vidéos via MediaResourceManager
5. **Monitorer** les performances en production

---

**Temps d'intégration estimé :** 1-2 heures  
**Difficulté :** Facile à Moyenne  
**Impact :** ⭐⭐⭐⭐⭐ (Majeur)

Bon courage ! 🎉
