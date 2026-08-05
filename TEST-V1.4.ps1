$ErrorActionPreference = "Stop"

Set-Location "D:\Codex\hakuneko-next"

Write-Host "Restauration des traductions gérées par Crowdin..." -ForegroundColor Cyan
git restore web/src/i18n/locales

Write-Host "Nettoyage des anciennes sauvegardes de test..." -ForegroundColor Cyan
Get-ChildItem "web/src/frontend/classic/components" -Filter "*.bak" -ErrorAction SilentlyContinue |
    Remove-Item -Force

Write-Host "Vérification du web..." -ForegroundColor Cyan
npm --workspace=web run check

Write-Host "Build web..." -ForegroundColor Cyan
npm --workspace=web run build

Write-Host "Préparation Electron..." -ForegroundColor Cyan
npm --workspace=app/electron run build

Write-Host "" 
Write-Host "HakuNeko-Next v1.4.0 est prêt à tester." -ForegroundColor Green
Write-Host "Terminal 1 : npm --workspace=web run serve:dev"
Write-Host "Terminal 2 : npm --workspace=app/electron run launch:dev"
