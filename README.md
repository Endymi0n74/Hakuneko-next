# Correctif MangaFire — ajout de favoris sans l'API 403

Le premier patch tentait encore `/api/titles/{id}` avant le fallback.
Cette version supprime complètement cet appel lors du collage d'une URL.

Après validation du captcha, HakuNeko-Next lit directement la page du manga :

- identifiant depuis l'URL ;
- titre depuis le `h1`, Open Graph, Twitter ou le titre de la page ;
- création du favori sans requête vers `/api/titles/{id}`.

## Installation

Extraire le ZIP à la racine :

```text
D:\Codex\hakuneko-next
```

Puis lancer :

```powershell
cd D:\Codex\hakuneko-next
node .\apply-mangafire-bookmark-page-only.mjs
```

## Test live

Terminal 1 :

```powershell
cd D:\Codex\hakuneko-next
npm --workspace=web run serve:dev
```

Terminal 2 :

```powershell
cd D:\Codex\hakuneko-next
npm --workspace=app/electron run launch:dev
```

Colle ensuite une URL MangaFire, valide le captcha et vérifie que le manga
est ajouté à la liste.

## Vérification du code

```powershell
npm --workspace=web run check
npm --workspace=web run build
npm --workspace=app/electron run check
npm --workspace=app/electron run build
```

## Annulation

```powershell
node .\restore-mangafire-bookmark-page-only.mjs
```
