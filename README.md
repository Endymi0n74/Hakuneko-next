# Lot propre de test v1.4

Ce lot remplace les scripts précédents.

Il :

- restaure les traductions gérées par Crowdin ;
- corrige les erreurs ESLint de `FetchProviderCommon.ts` ;
- reconstruit proprement tout le bloc de gestion des langues ;
- garantit le bon ordre des déclarations Svelte ;
- ajoute les drapeaux, le compteur, l'ordre stable et les choix All / None.

## Installation

Copier les deux scripts `.mjs` à la racine du dépôt puis lancer :

```powershell
cd D:\Codex\hakuneko-next

node .\apply-v1.4-clean-test.mjs

npm --workspace=web run check
npm --workspace=web run build
```

## Test local

Terminal 1 :

```powershell
npm --workspace=web run serve:dev
```

Terminal 2 :

```powershell
npm --workspace=app/electron run launch:dev
```

## Annulation

```powershell
node .\restore-v1.4-clean-test.mjs
```
