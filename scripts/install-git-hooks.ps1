# Instala hooks de Git locales. Corre esto una vez despues de clonar o pull.
# Los hooks NO se commitean al repo (viven en .git/hooks/); este script los (re)genera.
#
# Uso:  powershell.exe -ExecutionPolicy Bypass -File scripts\install-git-hooks.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
  Write-Error "No estas dentro de un repositorio Git."
  exit 1
}

$hooksDir = Join-Path $repoRoot ".git\hooks"
if (-not (Test-Path $hooksDir)) {
  Write-Error "No encuentro $hooksDir"
  exit 1
}

# ============================================================
# pre-push: corre `npm run lint` antes de permitir el push.
# Si lint falla, el push se aborta y el dev arregla antes de pushear.
# Salvavidas contra errores ESLint que solo se detectan en Vercel build.
# ============================================================
$prePush = @'
#!/bin/sh
# Pre-push: valida que `npm run lint` pase antes de pushear.
# Autogenerado por scripts/install-git-hooks.ps1.

echo ""
echo "⏳ pre-push: corriendo 'npm run lint'..."

npm run lint --silent
status=$?

if [ $status -ne 0 ]; then
  echo ""
  echo "❌ Lint fallo. Push abortado."
  echo "   Corrige los errores y vuelve a intentar."
  echo "   Para pushear igualmente (no recomendado): git push --no-verify"
  echo ""
  exit $status
fi

echo "✅ Lint OK. Continuando con el push..."
echo ""
exit 0
'@

$prePushPath = Join-Path $hooksDir "pre-push"
# Escribir con LF y sin BOM (Git on Windows needs this for /bin/sh scripts)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($prePushPath, ($prePush -replace "`r`n", "`n"), $utf8NoBom)

Write-Host ""
Write-Host "✅ Hook instalado: $prePushPath" -ForegroundColor Green
Write-Host ""
Write-Host "A partir de ahora, cada 'git push' correra 'npm run lint' primero."
Write-Host "Si falla, el push se aborta."
Write-Host ""
Write-Host "Para bypasear el hook (caso excepcional):" -ForegroundColor Yellow
Write-Host "  git push --no-verify"
Write-Host ""
