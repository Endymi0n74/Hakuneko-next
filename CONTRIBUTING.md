# Contribuer à HakuNeko Next

Merci de l'intérêt porté au projet.

## Avant de commencer

- Vérifie qu'une issue similaire n'existe pas déjà.
- Décris clairement le problème ou l'amélioration proposée.
- Garde les changements ciblés et faciles à relire.

## Installation

```bash
npm run npm:clean-install
```

## Vérifications attendues

Avant une pull request :

```bash
npm run check
npm run test
```

Pour les changements Electron :

```bash
npm --workspace=app/electron run bundle
```

Teste ensuite l'exécutable extrait dans un dossier neuf, sans serveur Vite actif.

## Style des commits

Exemples :

```text
fix(electron): package web app in desktop builds
feat(download): add download option
docs: improve build instructions
chore(ci): update release workflow
```

## Utilisation de l'IA

Les contributions assistées par IA sont acceptées à condition que leur auteur :

- comprenne suffisamment le changement proposé ;
- vérifie le diff ;
- compile le projet ;
- teste le comportement modifié ;
- signale honnêtement les limites connues.

Du code généré mais non testé peut être refusé.

## Pull requests

Une pull request doit préciser :

- ce qui a été modifié ;
- pourquoi ;
- comment le changement a été testé ;
- les plateformes vérifiées ;
- les limitations restantes.
