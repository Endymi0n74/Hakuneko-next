HAKUNEKO-NEXT v1.4.0 - LOT FINAL DE TEST

1. Extraire ce ZIP dans D:\Codex\hakuneko-next en remplaçant les fichiers.
2. Lancer :

   Set-ExecutionPolicy -Scope Process Bypass
   .\TEST-V1.4.ps1

3. Quand le script termine, lancer :

   npm --workspace=web run serve:dev

   Puis dans un second terminal :

   npm --workspace=app/electron run launch:dev

CE LOT CONTIENT :
- titre HakuNeko-Next (=^･ω･^=)
- menus cohérents en anglais, français et portugais brésilien
- page d'accueil / à propos HakuNeko-Next 1.4.0
- sélecteur de langues avec drapeaux, compteur, ordre stable et affichage/masquage
- traductions locales sans modifier les fichiers Crowdin
- version web 1.4.0
