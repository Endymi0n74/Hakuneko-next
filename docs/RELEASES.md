# Publication des releases

Les releases sont créées avec GitHub Actions.

## Workflow

Le workflow principal est :

```text
.github/workflows/create-release.yml
```

Il est lancé manuellement depuis l'onglet Actions.

## Étapes

1. Checkout du dépôt.
2. Installation de Node.js et des dépendances.
3. Build Electron sur Windows, macOS et Linux.
4. Build NW.js sur les plateformes prises en charge.
5. Détection des fichiers réellement générés.
6. Upload temporaire des artifacts.
7. Création ou mise à jour de la GitHub Release.
8. Publication des archives et installateurs.

## Préversion

Lors du lancement manuel, l'option `prerelease` permet de publier une préversion.

## Avant publication

- Vérifier la version dans `package.json`.
- Tester au moins une build locale.
- Vérifier que le dépôt est propre.
- Pousser les derniers commits.
- Lancer un nouveau workflow, plutôt que relancer un ancien run basé sur un commit précédent.
