# Guide de développement

## Interface web

```bash
npm --workspace=web run serve:dev
```

Le serveur de développement écoute sur le port 3000.

## Electron

Dans un autre terminal :

```bash
npm --workspace=app/electron run launch:dev
```

Le mode développement charge l'interface depuis le serveur Vite.

## Vérifications

```bash
npm run check
npm run test
```

## Débogage Electron

Sous PowerShell :

```powershell
$env:ELECTRON_ENABLE_LOGGING = "1"
$env:ELECTRON_ENABLE_STACK_DUMPING = "1"
& ".\chemin\vers\HakuNeko-electron.exe" --enable-logging --v=1
```

## Bonnes pratiques

- Ne pas supposer qu'une compilation réussie garantit que l'application démarre.
- Tester une archive extraite hors du dépôt.
- Vérifier les chemins `file://` dans les builds Electron.
- Ne pas publier un changement IA non relu.
- Garder les commits ciblés et explicites.
