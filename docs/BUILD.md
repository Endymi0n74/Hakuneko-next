# Construire HakuNeko Next

## Prérequis

- Node.js 22.13 ou plus récent
- npm 10.9 ou plus récent
- Git

## Dépendances

```bash
npm run npm:clean-install
```

## Build web

```bash
npm --workspace=web run build
```

Sortie :

```text
web/build/
```

## Build Electron

```bash
npm --workspace=app/electron run bundle
```

Sortie :

```text
app/electron/bundle/
```

Le packaging Electron compile l'interface web avec des chemins relatifs, la copie dans `resources/app/web`, génère le point d'entrée Electron puis prépare les archives distribuables.

## Build NW.js

```bash
npm --workspace=app/nw run bundle
```

Sortie :

```text
app/nw/bundle/
```

Tous les formats NW.js ne sont pas nécessairement produits sur chaque système.

## Nettoyage manuel

Sous PowerShell :

```powershell
Remove-Item .\web\build -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\app\electron\build -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .\app\electron\bundle -Recurse -Force -ErrorAction SilentlyContinue
```

## Test d'une build

1. Extraire l'archive dans un nouveau dossier.
2. Vérifier qu'aucun serveur Vite n'est actif.
3. Lancer l'exécutable.
4. Tester la navigation, les paramètres et un téléchargement.
5. Redémarrer l'application pour vérifier la persistance.
