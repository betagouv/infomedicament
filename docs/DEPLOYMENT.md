# Workflow de déploiement

## Principe général

`main` est la **source unique de vérité**. Les branches `staging` et `production` sont comme des curseurs qui pointent vers des états de `main`.

```
feature-A ──┐
            ├──▶ main (source de vérité)
feature-B ──┘      │
                   ├──▶ staging (= main à un instant T)
                   │
                   └──▶ production (= main à un instant T-1)
```

On ne **commit jamais directement** sur `staging` ou `production`. Tout passe par `main`.

## Branches

| Branche | Rôle | Déploiement |
|---------|------|-------------|
| `main` | Branche de développement, source de vérité | - |
| `staging` | Environnement de test/recette | Auto-déployé sur Scalingo staging |
| `production` | Environnement de production | Auto-déployé sur Scalingo production (branche protégée sur GitHub) |

## Review Apps

Une review app est automatiquement déployée sur Scalingo pour chaque Pull Request ouverte.

**Attention** : les review apps utilisent la **base de données de staging**.

Cela signifie que :
- Les migrations présentes dans une PR s'exécutent sur la base de staging dès le déploiement de la review app, ce qui peut casser l'appli de staging
- Une migration destructive (suppression de colonne, etc.) peut aussi particulièrement impacter l'environnement de staging

Pour les PRs contenant des migrations sensibles, le mieux serait de désactiver temporairement le déploiement automatique de la review app.

## Workflow quotidien

### 1. Développer une feature

```bash
# Créer une branche depuis main
git checkout main
git pull
git checkout -b ma-feature

# Développer, committer...
git add .
git commit

# Pousser et créer une PR vers main
git push -u origin ma-feature
```

Puis créer une Pull Request vers `main` sur GitHub.

### 2. Déployer en staging

Une fois la PR mergée dans `main`, déployer en staging en faisant une PR et en créant un **Merge commit**:

```bash
# Sur GitHub : créer une PR main → staging
# Demander et attendre une revue d'un collègue
# Merger avec l'option "Create a merge commit"
```

Ou en ligne de commande :

```bash
git checkout staging
git pull
git merge main
git push
```

### 3. Déployer en production

Après validation sur staging :

```bash
# Sur GitHub : créer une PR staging → production
# Merger avec l'option "Create a merge commit"
```

La branche `production` étant protégée, le passage par une PR est obligatoire.

## Hotfix urgent

Même pour un hotfix urgent, **tout passe par `main`** :

```bash
# 1. Créer le fix sur main
git checkout main
git pull
git checkout -b hotfix/mon-fix
# ... fix ...
git commit
git push -u origin hotfix/mon-fix

# 2. PR vers main (review accélérée)

# 3. Une fois mergé, propager rapidement
# PR main → staging, merger
# PR staging → production, merger
```

## Configuration GitHub

### Type de merge recommandé

Pour les PRs vers `staging` et `production`, utiliser **"Create a merge commit"** (pas rebase, pas squash).

Cela garantit :
- Un commit de merge daté = date exacte du déploiement
- Pas de réécriture d'historique = pas de divergence de branches
- Traçabilité complète

### Protection de branche

- `production` : branche protégée, PR obligatoire
- `staging` : PR recommandée mais pas obligatoire

## Commandes utiles

Assurez-vous que vous ayez tiré les changements depuis GitHub

### Voir ce qui est déployé en production

```bash
git log production --oneline
```

### Voir ce qui est en staging mais pas encore en production

```bash
git log production..staging --oneline
```

### Voir ce qui est dans main mais pas encore en staging

```bash
git log staging..main --oneline
```

### Trouver la date d'un déploiement

Les commits de merge indiquent la date exacte du déploiement :

```bash
git log production --merges --oneline
```