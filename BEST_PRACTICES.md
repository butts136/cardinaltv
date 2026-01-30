# 🎓 Cardinal TV - Bonnes pratiques de développement

## 📌 Principes fondamentaux

### 1. **Performance First**
Toujours penser aux machines faibles en priorité. Si ça fonctionne sur une machine à 2GB RAM, ça fonctionnera partout.

### 2. **Cleanup Automatique**
Chaque ressource créée (timer, vidéo, listener) doit avoir une stratégie de cleanup claire.

### 3. **Fallback Gracieux**
Ne jamais crasher si une API n'est pas disponible. Toujours avoir un plan B.

### 4. **Mesure et Ajuste**
Utiliser les outils de monitoring intégrés pour identifier les vrais problèmes.

---

## ✅ Bonnes pratiques par catégorie

### 🕐 Timers et Intervalles

#### ✅ À FAIRE
```javascript
// Utiliser TimerManager avec clés descriptives
const timers = window.CardinalPerformanceManager?.timers;
timers.setTimeout('clockUpdate', updateClock, 1000);

// Nettoyer avec la même clé
timers.clearTimeout('clockUpdate');
```

#### ❌ À ÉVITER
```javascript
// Timers non trackés
let timer1 = setTimeout(fn1, 1000);
let timer2 = setTimeout(fn2, 2000);
// Risque d'oubli de cleanup
```

### 🎬 Vidéos

#### ✅ À FAIRE
```javascript
const mediaManager = window.CardinalPerformanceManager?.media;
const video = document.createElement('video');

// Configurer
video.src = url;
video.muted = true;
video.playsInline = true;

// Enregistrer
if (mediaManager) {
  mediaManager.registerVideo(video);
}

// Libérer quand terminé
if (mediaManager) {
  mediaManager.releaseVideo(video);
}
```

#### ❌ À ÉVITER
```javascript
// Créer des vidéos sans limite
const video1 = createVideo(url1);
const video2 = createVideo(url2);
const video3 = createVideo(url3);
// Sur machine faible : crash par manque de mémoire
```

### 🎨 Modifications DOM

#### ✅ À FAIRE
```javascript
const domBatch = window.CardinalPerformanceManager?.domBatch;

// Grouper les modifications
domBatch.schedule(() => {
  element1.style.transform = 'translate(0, 0)';
  element2.classList.add('active');
  element3.textContent = 'Nouveau';
  element4.style.opacity = '1';
});
```

#### ❌ À ÉVITER
```javascript
// Modifications séquentielles sans batch
element1.style.transform = 'translate(0, 0)'; // Reflow 1
element2.classList.add('active');             // Reflow 2
element3.textContent = 'Nouveau';             // Reflow 3
element4.style.opacity = '1';                 // Reflow 4
// 4 reflows au lieu d'1 seul !
```

### 🎯 Animations

#### ✅ À FAIRE
```javascript
// Utiliser transform et opacity (GPU)
element.style.transform = 'translateX(100px)';
element.style.opacity = '0.5';

// Will-change uniquement en mode high power
if (!performanceProfile.lowPower) {
  element.style.willChange = 'transform';
}
```

#### ❌ À ÉVITER
```javascript
// Animer left/top (CPU intensif)
element.style.left = '100px'; // Reflow!
element.style.top = '50px';   // Reflow!

// Will-change partout
element.style.willChange = 'transform, opacity, left, top';
// Gaspillage de mémoire GPU
```

### 🚀 Performance adaptative

#### ✅ À FAIRE
```javascript
// Adapter selon le profil
const profile = window.CardinalPerformanceManager?.profile;

if (profile?.lowPower) {
  // Simplifier
  animationDuration = 200;
  maxItems = 10;
  enableEffects = false;
} else {
  // Full features
  animationDuration = 400;
  maxItems = 50;
  enableEffects = true;
}
```

#### ❌ À ÉVITER
```javascript
// Même comportement partout
const animationDuration = 500; // Trop long sur machine faible
const maxItems = 100;          // Trop gourmand
// Pas d'adaptation aux capacités
```

### 📦 Cache et Mémoire

#### ✅ À FAIRE
```javascript
// Respecter les limites du profil
const maxCache = performanceProfile.maxCacheSize || 50;
const cache = new Map();

function addToCache(key, value) {
  if (cache.size >= maxCache) {
    // Supprimer le plus ancien
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}
```

#### ❌ À ÉVITER
```javascript
// Cache illimité
const cache = new Map();
function addToCache(key, value) {
  cache.set(key, value); // Croissance infinie
}
// Fuite mémoire garantie
```

### 🔄 Event Listeners

#### ✅ À FAIRE
```javascript
const handleResize = () => {
  // ...
};

// Throttle les events fréquents
const { throttle } = window.CardinalPerformanceManager?.utils || {};
const throttledResize = throttle ? throttle(handleResize, 250) : handleResize;

window.addEventListener('resize', throttledResize);

// Cleanup
window.removeEventListener('resize', throttledResize);
```

#### ❌ À ÉVITER
```javascript
// Listener non throttlé sur event fréquent
window.addEventListener('scroll', () => {
  // Exécuté 100+ fois par seconde
  updatePosition(); // CPU à 100%
});

// Pas de cleanup
// Fuite mémoire si l'élément est recréé
```

---

## 🎯 Checklist avant commit

### Performance
- [ ] Pas de setTimeout/setInterval direct (utiliser TimerManager)
- [ ] Pas de modifications DOM en boucle (utiliser DOMBatch)
- [ ] Vidéos enregistrées dans MediaResourceManager
- [ ] Animations GPU (transform/opacity)
- [ ] Throttle sur events fréquents (resize, scroll)

### Mémoire
- [ ] Tous les timers ont un cleanup
- [ ] Tous les listeners ont un removeEventListener
- [ ] Cache a une limite de taille
- [ ] Object URLs sont révoqués
- [ ] Vidéos sont libérées

### Compatibilité
- [ ] Fallback si Performance Manager absent
- [ ] Adapté au mode low power
- [ ] Fonctionne sans GPU acceleration
- [ ] Compatible mobile

### Debug
- [ ] Console.log informatifs (pas d'erreurs)
- [ ] Mesures de performance ajoutées
- [ ] Tests sur machine faible effectués

---

## 🧪 Tests recommandés

### Test 1 : Machine faible
```
URL: /slideshow?perf=low
Durée: 10 minutes
Critères:
  - FPS ≥ 25
  - CPU < 40%
  - RAM stable
  - Pas de lag
```

### Test 2 : Session longue
```
URL: /slideshow
Durée: 2 heures
Critères:
  - Mémoire stable (pas de croissance)
  - Pas de ralentissement
  - Transitions fluides
```

### Test 3 : Charge maximale
```
Setup: 50 slides actives
Durée: 30 minutes
Critères:
  - Pas de crash
  - FPS stable
  - Temps de transition < 500ms
```

### Test 4 : Mobile
```
Device: Smartphone ancien (4 ans+)
Durée: 10 minutes
Critères:
  - Pas de freeze
  - Batterie acceptable
  - Tactile réactif
```

---

## 🔍 Debugging

### Vérifier les timers actifs
```javascript
const stats = window.CardinalPerformanceManager.timers.getActiveCount();
console.table(stats);

// Devrait afficher :
// {
//   timers: 3-5,      // Peu de timers ponctuels
//   intervals: 2-3,   // Clock, refresh playlist
//   frames: 0-1,      // Animations en cours
//   total: 5-9        // MAXIMUM 10-15
// }
```

### Vérifier les vidéos
```javascript
const mediaManager = window.CardinalPerformanceManager.media;
console.log("Vidéos actives:", mediaManager.activeVideos.size);
console.log("Object URLs:", mediaManager.objectUrls.size);

// activeVideos: 0-2 max
// objectUrls: Devrait diminuer au fil du temps
```

### Vérifier le FPS
```javascript
const fps = window.CardinalPerformanceManager.fps;
console.log("FPS actuel:", fps.getFPS());
console.log("Performance OK:", fps.isPerformingWell());

// Low power: FPS ≥ 25
// High power: FPS ≥ 55
```

### Profil de Performance Monitor
```
1. F12 > Performance
2. Cliquer Record
3. Attendre 30 secondes
4. Stop
5. Analyser:
   - Scripting: < 30%
   - Rendering: < 20%
   - Painting: < 10%
   - Memory: Stable (pas de sawtooth)
```

---

## 📊 Métriques cibles

### CPU (selon mode)
| Mode | Idle | Transition | Moyenne |
|------|------|------------|---------|
| Low  | 5-10%| 25-35%     | 15-25%  |
| High | 10-20%| 35-50%    | 25-40%  |

### Mémoire
| Phase | Début | 1h | 4h | 8h |
|-------|-------|----|----|-----|
| MB    | 80-100| 90-110| 90-110| 90-110|

Croissance acceptable : < 30MB en 8h

### FPS
| Mode | Min | Target | Max |
|------|-----|--------|-----|
| Low  | 25  | 30     | 30  |
| High | 55  | 60     | 60  |

### Latence
- Changement slide : < 200ms
- Réponse UI : < 100ms
- Première frame : < 500ms

---

## 🚫 Anti-patterns à éviter

### 1. Magic Numbers
```javascript
// ❌ Mauvais
setTimeout(update, 16); // Pourquoi 16 ?

// ✅ Bon
const FRAME_TIME_MS = 1000 / performanceProfile.maxAnimationFps;
setTimeout(update, FRAME_TIME_MS);
```

### 2. Nested Timers
```javascript
// ❌ Mauvais
setTimeout(() => {
  setTimeout(() => {
    setTimeout(() => {
      // Timer hell
    }, 100);
  }, 100);
}, 100);

// ✅ Bon
const timers = window.CardinalPerformanceManager.timers;
timers.setTimeout('step1', () => {
  timers.setTimeout('step2', () => {
    timers.setTimeout('step3', callback, 100);
  }, 100);
}, 100);
// Ou mieux : Promise.all ou async/await
```

### 3. État Global Non Nettoyé
```javascript
// ❌ Mauvais
let currentVideo = null;
function showVideo(url) {
  currentVideo = createVideo(url); // Ancienne vidéo jamais libérée
}

// ✅ Bon
let currentVideo = null;
function showVideo(url) {
  if (currentVideo) {
    mediaManager.releaseVideo(currentVideo);
  }
  currentVideo = createVideo(url);
  mediaManager.registerVideo(currentVideo);
}
```

### 4. Sync au lieu d'Async
```javascript
// ❌ Mauvais
const data = fetchDataSync(); // Bloque l'UI
processData(data);

// ✅ Bon
const data = await fetchDataAsync();
processData(data);
// Ou avec callback si nécessaire
```

---

## 📚 Ressources

### Documentation interne
- `PERFORMANCE_OPTIMIZATIONS.md` - Détails techniques
- `INTEGRATION_GUIDE.md` - Guide d'intégration
- `AGENTS.md` - Conventions du projet

### API Performance Web
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [RequestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

### Outils
- Chrome DevTools Performance
- Firefox Performance Monitor
- Lighthouse CI

---

## 🎯 Conclusion

En suivant ces bonnes pratiques, vous garantissez :
- ✅ Performance optimale sur toutes les machines
- ✅ Pas de fuites mémoire
- ✅ Code maintenable et testable
- ✅ Expérience utilisateur fluide
- ✅ Compatibilité long terme

**N'oubliez pas :** Un slideshow qui lag détruit l'expérience utilisateur. La performance n'est pas optionnelle, c'est une fonctionnalité.

---

**Version :** 1.0.0  
**Dernière mise à jour :** 2026-01-29  
**Auteur :** Cardinal TV Performance Team
