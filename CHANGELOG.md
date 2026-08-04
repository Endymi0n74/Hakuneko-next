# Changelog

Les changements importants seront consignés dans ce fichier.

## [1.0.0]

Première release publiée de ce fork.

### Ajouté

- Builds desktop automatisés.
- Publication des archives dans GitHub Releases.
- Interface web embarquée dans les builds Electron.
- Packaging Electron autonome pour Windows, macOS et Linux selon disponibilité.
- Documentation du développement assisté par IA.

### Corrigé

- Chargement de l'application Electron sans serveur localhost.
- Compatibilité CommonJS du point d'entrée Electron packagé.
- Chemins relatifs des assets Vite sous `file://`.
- Copie du build web dans les ressources Electron.
- Publication des artifacts de release.
