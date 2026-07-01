param(
  [string]$SshHost = "138.199.214.208",
  [string]$SshUser = "root",
  [string]$SshKey = "$HOME\.ssh\Warpala_OS_hetzner",
  [string]$RemoteDir = "/root/3d-izstade-staging",
  [string[]]$ReleasePaths = @(
    "backend-server",
    "docs/booth-slot-bank.json",
    "src",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "docker-compose.staging.yml"
  ),
  [switch]$AllowDirty,
  [switch]$PrepareOnly,
  [switch]$SkipDockerBuild
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  Write-Host "> $FilePath $($Arguments -join ' ')"
  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Command failed with exit code $($process.ExitCode): $FilePath $($Arguments -join ' ')"
  }
}

function Write-Utf8NoBom {
  param(
    [string]$Path,
    [string]$Content
  )

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath (Split-Path -Parent $Path)).Path + "\" + (Split-Path -Leaf $Path), $Content.Replace("`r`n", "`n"), $encoding)
}

if (!(Test-Path -LiteralPath $SshKey)) {
  throw "SSH key not found: $SshKey"
}

$branch = (& git branch --show-current).Trim()
$commit = (& git rev-parse HEAD).Trim()
$shortCommit = (& git rev-parse --short=12 HEAD).Trim()
$status = (& git status --short)

if ($status -and !$AllowDirty) {
  Write-Host $status
  throw "Working tree is dirty. Commit or stash first, or pass -AllowDirty intentionally."
}

$tmpRoot = Join-Path ".codex-tmp" "hetzner-backend-deploy"
New-Item -ItemType Directory -Force -Path $tmpRoot | Out-Null

$archiveName = "3d-staging-backend-src-$shortCommit.tar"
$archivePath = Join-Path $tmpRoot $archiveName
$remoteArchivePath = "/tmp/$archiveName"
$remoteScriptPath = "/tmp/3d-staging-backend-deploy-$shortCommit.sh"
$remoteBackupDir = "/root/3d-izstade-staging-backups/$shortCommit-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

$archiveArgs = @("archive", "--format=tar", "-o", $archivePath, "HEAD", "--") + $ReleasePaths
Invoke-Checked "git" $archiveArgs

$dockerCommand = if ($SkipDockerBuild) {
  "docker compose -f docker-compose.staging.yml --env-file .env.docker up -d backend-staging"
} else {
  "docker compose -f docker-compose.staging.yml --env-file .env.docker up -d --build backend-staging"
}

$remoteScript = @"
set -euo pipefail
echo "[staging-backend] remote dir: $RemoteDir"
echo "[staging-backend] release commit: $commit"
test -d "$RemoteDir"
test -f "$RemoteDir/.env.docker"
mkdir -p "$remoteBackupDir"
cd "$RemoteDir"
echo "[staging-backend] creating lightweight source backup: $remoteBackupDir"
for path in package.json package-lock.json docker-compose.staging.yml backend-server src/backend src/shared supabase; do
  if [ -e "`$path" ]; then
    mkdir -p "$remoteBackupDir/`$(dirname "`$path")"
    cp -a "`$path" "$remoteBackupDir/`$path"
  fi
done
echo "[staging-backend] extracting archive"
tar -xf "$remoteArchivePath" -C "$RemoteDir"
cd "$RemoteDir"
echo "[staging-backend] docker compose deploy"
$dockerCommand
echo "[staging-backend] compose status"
docker compose -f docker-compose.staging.yml --env-file .env.docker ps
echo "[staging-backend] health check"
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -fsS http://127.0.0.1:3001/health; then
    echo
    echo "[staging-backend] health ok"
    exit 0
  fi
  echo "[staging-backend] waiting for health attempt `$attempt"
  sleep 5
done
echo "[staging-backend] backend health failed; recent logs follow"
docker logs --tail=160 3d-izstade-staging-backend-staging-1 || true
exit 1
"@

$remoteScriptLocalPath = Join-Path $tmpRoot "remote-deploy-$shortCommit.sh"
Write-Utf8NoBom -Path $remoteScriptLocalPath -Content $remoteScript

Write-Host "[staging-backend] branch: $branch"
Write-Host "[staging-backend] commit: $commit"
Write-Host "[staging-backend] archive: $archivePath"
Write-Host "[staging-backend] remote: ${SshUser}@${SshHost}:$RemoteDir"

if ($PrepareOnly) {
  Write-Host "[staging-backend] prepare-only complete; no network deploy executed."
  exit 0
}

Invoke-Checked "scp" @("-i", $SshKey, "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", $archivePath, "${SshUser}@${SshHost}:$remoteArchivePath")
Invoke-Checked "scp" @("-i", $SshKey, "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", $remoteScriptLocalPath, "${SshUser}@${SshHost}:$remoteScriptPath")
Invoke-Checked "ssh" @("-i", $SshKey, "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "${SshUser}@${SshHost}", "bash", $remoteScriptPath)

Write-Host "[staging-backend] deploy complete"
