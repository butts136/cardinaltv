# 🚀 Guide de Test Rapide - Optimisations Cardinal TV

## ✅ Intégration terminée !

Les optimisations de performance sont maintenant **actives** sur ton projet Cardinal TV.

---

## 🎯 Tests à effectuer (10 minutes)

### Test 1 : Vérifier le chargement (2 min)

1. **Ouvre le slideshow** :
   ```
   http://127.0.0.1:39015/slideshow
   ```

2. **Ouvre la console** (F12)

3. **Cherche ce message** :
   ```
   🚀 Cardinal Performance Manager initialized
   📊 Profile: {lowPower: false/true, ...}
   ```

4. **Vérifie qu'il n'y a PAS d'erreurs** ❌

✅ **Si tu vois le message = Optimisations actives !**

---

### Test 2 : Mode Low Power (3 min)

1. **Ouvre avec mode forcé** :
   ```
   http://127.0.0.1:39015/slideshow?perf=low
   ```

2. **Dans la console, tape** :
   ```javascript
   CardinalPerformanceManager.profile
   ```

3. **Vérifie que tu vois** :
   ```javascript
   {
     lowPower: true,
     maxAnimationFps: 30,
     maxConcurrentVideos: 1,
     // ...
   }
   ```

4. **Regarde en haut à gauche** : tu devrais voir un **badge rouge** "Low Power"

✅ **Badge rouge visible + lowPower: true = Succès !**

---

### Test 3 : Mode High Performance (3 min)

1. **Ouvre avec mode forcé** :
   ```
   http://127.0.0.1:39015/slideshow?perf=high
   ```

2. **Dans la console, tape** :
   ```javascript
   CardinalPerformanceManager.profile
   ```

3. **Vérifie que tu vois** :
   ```javascript
   {
     lowPower: false,
     maxAnimationFps: 60,
     maxConcurrentVideos: 2,
     // ...
   }
   ```

4. **Regarde en haut à gauche** : tu devrais voir un **badge vert** "High Perf"

✅ **Badge vert visible + lowPower: false = Succès !**

---

### Test 4 : Vérifier les FPS (2 min)

1. **Pendant le slideshow, dans la console tape** :
   ```javascript
   CardinalPerformanceManager.fps.getFPS()
   ```

2. **Tu devrais voir** :
   - En mode **low** : environ **30 FPS**
   - En mode **high** : environ **55-60 FPS**

3. **Tape aussi** :
   ```javascript
   CardinalPerformanceManager.timers.getActiveCount()
   ```

4. **Tu devrais voir** : un nombre entre **5-10** (pas 30+ comme avant)

✅ **FPS stables + peu de timers = Optimisations fonctionnent !**

---

## 🐛 Dépannage rapide

### Problème : Pas de message dans la console

**Solution** :
1. Vide le cache du navigateur (Ctrl + Shift + Delete)
2. Force le refresh (Ctrl + F5)
3. Vérifie que `performance_manager.js` est bien chargé dans l'onglet "Sources"

### Problème : Erreur "CardinalPerformanceManager is not defined"

**Solution** :
1. Vérifie que `performance_manager.js` est chargé **AVANT** `slideshow.js`
2. Regarde l'onglet "Network" pour voir l'ordre de chargement
3. Vérifie qu'il n'y a pas d'erreur 404 sur le fichier

### Problème : Pas de badge visible

**Solution** :
1. Vérifie que `performance.css` est bien chargé
2. Tape dans la console :
   ```javascript
   document.querySelector('.perf-badge-wrapper')
   ```
3. Si `null`, le CSS n'est pas appliqué

---

## 📊 Commandes utiles pour monitoring

### Stats en temps réel
```javascript
// FPS actuel
CardinalPerformanceManager.fps.getFPS()

// Nombre de timers actifs
CardinalPerformanceManager.timers.getActiveCount()

// Profil appliqué
console.log(CardinalPerformanceManager.profile)

// Détection matérielle
console.log(CardinalPerformanceManager.hardware)

// Voir tous les timers actifs
CardinalPerformanceManager.timers.timers
```

### Forcer un mode
```javascript
// Forcer low power
window.location = '/slideshow?perf=low'

// Forcer high performance
window.location = '/slideshow?perf=high'

// Mode automatique (détection)
window.location = '/slideshow'
```

---

## 🎯 Résultats attendus

### Sur machine faible (2-4GB RAM)
- ✅ Mode **Low Power** activé automatiquement
- ✅ FPS stable à **30**
- ✅ Pas de freeze/lag
- ✅ CPU < 30%
- ✅ Badge rouge visible

### Sur machine puissante (8GB+ RAM)
- ✅ Mode **High Performance** activé automatiquement
- ✅ FPS stable à **60**
- ✅ Très fluide
- ✅ CPU < 40%
- ✅ Badge vert visible

---

## 📝 Checklist de validation

- [ ] Serveur démarre sans erreur
- [ ] Console affiche message "Performance Manager initialized"
- [ ] Mode low fonctionne (`?perf=low`)
- [ ] Mode high fonctionne (`?perf=high`)
- [ ] FPS correspondent au mode
- [ ] Badges visibles
- [ ] Pas d'erreur JavaScript
- [ ] Slideshow fonctionne normalement
- [ ] Transitions fluides
- [ ] Vidéos se chargent correctement

---

## 🎓 Comprendre les badges

### Badge rouge "Low Power 30fps"
```
┌─────────────────────┐
│ 🔴 Low Power 30fps  │
│ 6 timers • 29.8 FPS │
└─────────────────────┘
```
- **Ligne 1** : Mode actif (Low Power) + FPS max
- **Ligne 2** : Timers actifs + FPS réels

### Badge vert "High Perf 60fps"
```
┌─────────────────────┐
│ 🟢 High Perf 60fps  │
│ 8 timers • 59.3 FPS │
└─────────────────────┘
```
- **Ligne 1** : Mode actif (High Perf) + FPS max
- **Ligne 2** : Timers actifs + FPS réels

---

## 🔬 Tests avancés (optionnel)

### Test de stabilité longue durée

1. **Lance le slideshow en mode low** :
   ```
   http://127.0.0.1:39015/slideshow?perf=low
   ```

2. **Ouvre le Gestionnaire des tâches** (Ctrl + Shift + Esc)

3. **Surveille pendant 30 minutes** :
   - Utilisation CPU (devrait rester < 30%)
   - Utilisation RAM (devrait rester stable)

4. **Vérifie dans la console** :
   ```javascript
   CardinalPerformanceManager.timers.getActiveCount()
   ```
   Le nombre ne devrait **PAS augmenter** avec le temps.

✅ **Si RAM stable et timers constants = Pas de fuites mémoire !**

### Test de transition intensive

1. **Réduis la durée des slides** (temporairement dans l'admin)

2. **Laisse défiler 50+ slides**

3. **Vérifie** :
   - Pas de ralentissement progressif
   - FPS restent stables
   - Pas de freeze

✅ **Si toujours fluide après 50 slides = Stabilité confirmée !**

---

## 📞 Support

### Tout fonctionne ? 🎉
**Bravo !** Les optimisations sont actives. Tu peux maintenant :
- Lire [BEST_PRACTICES.md](BEST_PRACTICES.md) pour améliorer encore
- Consulter [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) pour comprendre
- Tester sur une vraie machine faible pour valider

### Problèmes ? 🐛
1. Consulte [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) section "Dépannage"
2. Vérifie les logs console
3. Compare avec les exemples de code

---

## ✅ Validation finale

Une fois tous les tests passés :
- [ ] Mode automatique fonctionne
- [ ] Mode low fonctionne
- [ ] Mode high fonctionne
- [ ] FPS stables
- [ ] Pas de fuites mémoire
- [ ] Badges visibles
- [ ] Slideshow fluide

**🎉 Si tous cochés = SUCCÈS TOTAL !**

---

**Serveur actuel** : http://127.0.0.1:39015/slideshow  
**Date** : 29 janvier 2026  
**Version** : 2.0.0  
**Status** : ✅ PRÊT POUR TESTS
