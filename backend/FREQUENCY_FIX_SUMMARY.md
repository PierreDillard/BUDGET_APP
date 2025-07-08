# Correction du Système de Fréquence - Dépenses Trimestrielles

## Problème Identifié

Le système utilisait précédemment `calculateMonthlyEquivalent` qui **lissait** les dépenses trimestrielles sur plusieurs mois :
- Une dépense trimestrielle de 120€ était répartie comme 40€/mois
- Cela ne correspondait pas au besoin réel : déduire 120€ uniquement aux mois prévus

## Solution Implémentée

### 1. Nouvelle Fonction `calculateOccurredAmount`

Remplace le système de lissage par un calcul cumulatif des occurrences réelles :

```typescript
// Ancien système (lissé)
calculateMonthlyEquivalent(120, 'QUARTERLY') → 40€ chaque mois

// Nouveau système (occurrences réelles)
calculateOccurredAmount(120, 'QUARTERLY', {months: [1,4,7,10]}, 15, aujourd'hui)
→ 0€ en janvier avant le 15
→ 120€ en janvier après le 15  
→ 240€ en avril après le 15
→ 360€ en juillet après le 15
→ 480€ en octobre après le 15
```

### 2. Logique par Type de Fréquence

#### Fréquence Mensuelle
- Cumule tous les mois depuis janvier jusqu'à aujourd'hui
- Exemple : Salaire de 2500€ le 5 → 7 × 2500€ = 17 500€ au 8 juillet

#### Fréquence Trimestrielle  
- Déduit uniquement aux mois configurés (ex: janvier, avril, juillet, octobre)
- Vérifie si la date du mois est passée
- Exemple : Assurance 120€ le 15 → 240€ au 8 juillet (janvier + avril passés)

#### Fréquence Annuelle
- Déduit uniquement aux mois configurés dans l'année
- Exemple : Taxe foncière 600€ en octobre → 0€ jusqu'en septembre

### 3. Fichiers Modifiés

1. **`frequency-occurrence.utils.ts`** (nouveau)
   - `calculateOccurredAmount()` : calcul cumulatif des occurrences
   - `hasAlreadyOccurredThisYear()` : vérification d'occurrence

2. **`balance.service.ts`**
   - Remplacement de l'ancienne logique par `calculateOccurredAmount`
   - Correction du calcul des totaux pour l'affichage
   - Amélioration de la projection sur plusieurs jours

3. **`frequency.utils.ts`**
   - `calculateMonthlyEquivalent()` marquée comme dépréciée
   - Ajout de `isDueInCurrentMonth()` pour simplification

## Exemple Concret

Pour un utilisateur avec :
- Salaire : 2500€/mois le 5
- Loyer : 800€/mois le 1er  
- Assurance : 120€/trimestre le 15 (jan, avr, jul, oct)

**Au 8 juillet 2025 :**
- Revenus cumulés : 7 × 2500€ = 17 500€
- Dépenses cumulées : (7 × 800€) + (2 × 120€) = 5 840€
- Solde : 1000€ + 17 500€ - 5 840€ = **12 660€**

## Avantages

✅ **Exactitude** : Les dépenses trimestrielles sont déduites aux bonnes dates  
✅ **Transparence** : Le solde reflète la réalité des mouvements  
✅ **Flexibilité** : Gestion de toutes les fréquences (mensuelle, trimestrielle, annuelle)  
✅ **Compatibilité** : Réutilise l'API existante avec modifications minimales  

## Tests de Validation

- ✅ Test unitaire des calculs de fréquence
- ✅ Test d'intégration avec scénario réaliste  
- ✅ Vérification de cohérence entre méthodes de calcul
- ✅ Validation des cas limites (début/fin de période)

Le système gère maintenant correctement les dépenses trimestrielles selon vos spécifications !
