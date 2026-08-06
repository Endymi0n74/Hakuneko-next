param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

$oldVersions = @(
    '1.5.0',
    '1.5.0'
)

$newVersion = '1.5.0'

$excludedDirectories = @(
    '.git',
    'node_modules',
    'build',
    'dist',
    'bundle',
    'coverage',
    '.vite',
    '.cache'
)

$textExtensions = @(
    '.json', '.jsonc',
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.svelte', '.vue',
    '.html', '.css', '.scss', '.less',
    '.md', '.txt', '.yml', '.yaml',
    '.ps1', '.bat', '.cmd', '.sh',
    '.xml', '.toml', '.ini'
)

function Get-RelativePathSafe {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BasePath,

        [Parameter(Mandatory = $true)]
        [string]$FullPath
    )

    $base = [System.IO.Path]::GetFullPath($BasePath)
    $full = [System.IO.Path]::GetFullPath($FullPath)

    if(-not $base.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $base += [System.IO.Path]::DirectorySeparatorChar
    }

    $baseUri = [System.Uri]::new($base)
    $fullUri = [System.Uri]::new($full)

    return [System.Uri]::UnescapeDataString(
        $baseUri.MakeRelativeUri($fullUri).ToString()
    ).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
}

function Test-IsExcludedPath {
    param([string]$Path)

    $relative = Get-RelativePathSafe -BasePath $root -FullPath $Path
    $parts = $relative -split '[\\/]'

    foreach($part in $parts) {
        if($excludedDirectories -contains $part) {
            return $true
        }
    }

    return $false
}

function Get-EligibleFiles {
    Get-ChildItem $root -Recurse -File |
        Where-Object {
            -not (Test-IsExcludedPath $_.FullName) -and
            $textExtensions -contains $_.Extension.ToLowerInvariant()
        }
}

function Find-OldVersionReferences {
    param([System.IO.FileInfo[]]$Files)

    foreach($file in $Files) {
        $content = [System.IO.File]::ReadAllText($file.FullName)

        foreach($oldVersion in $oldVersions) {
            if($content.Contains($oldVersion)) {
                [PSCustomObject]@{
                    File = Get-RelativePathSafe -BasePath $root -FullPath $file.FullName
                    Version = $oldVersion
                }
            }
        }
    }
}

$files = @(Get-EligibleFiles)
$matches = @(Find-OldVersionReferences -Files $files)

if(-not $Apply) {
    Write-Host ''
    Write-Host 'Anciennes versions encore présentes :' -ForegroundColor Yellow

    if($matches.Count -gt 0) {
        $matches |
            Sort-Object File, Version |
            Format-Table -AutoSize
    } else {
        Write-Host 'Aucune occurrence trouvée.' -ForegroundColor Green
    }

    Write-Host ''
    Write-Host 'Relance avec -Apply pour remplacer les références actives par 1.5.0.' -ForegroundColor Cyan
    exit 0
}

npm pkg set version=$newVersion
npm pkg set version=$newVersion --workspace=web
npm pkg set version=$newVersion --workspace=app/electron
npm pkg set version=$newVersion --workspace=app/nw

if(Test-Path '.\docs\package.json') {
    npm pkg set version=$newVersion --workspace=docs
}

npm install --package-lock-only --ignore-scripts

foreach($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $updated = $content

    foreach($oldVersion in $oldVersions) {
        $updated = $updated.Replace($oldVersion, $newVersion)
    }

    if($updated -ne $content) {
        [System.IO.File]::WriteAllText(
            $file.FullName,
            $updated,
            [System.Text.UTF8Encoding]::new($false)
        )

        Write-Host "Mis à jour : $(Get-RelativePathSafe -BasePath $root -FullPath $file.FullName)"
    }
}

$files = @(Get-EligibleFiles)
$remaining = @(Find-OldVersionReferences -Files $files)

Write-Host ''
Write-Host 'Vérification finale :' -ForegroundColor Cyan

if($remaining.Count -gt 0) {
    $remaining |
        Sort-Object File, Version |
        Format-Table -AutoSize

    throw 'Des références aux versions 1.4.x subsistent.'
}

Write-Host 'Toutes les références actives sont en 1.5.0.' -ForegroundColor Green
