$envFile = Join-Path $PSScriptRoot '..\.env'
if (-not (Test-Path $envFile)) {
  Write-Error "No se encontró el archivo de configuración '.env'."
  exit 1
}

$envLines = Get-Content $envFile | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' }
$databaseUrl = $envLines | Where-Object { $_ -like 'DATABASE_URL=*' } | ForEach-Object { $_ -replace '^DATABASE_URL=', '' } | ForEach-Object { $_.Trim('"') }

if (-not $databaseUrl) {
  Write-Error "DATABASE_URL no está definido en .env"
  exit 1
}

try {
  $uri = [System.Uri]$databaseUrl
} catch {
  Write-Error "DATABASE_URL no es una URL válida"
  exit 1
}

$credentials = $uri.UserInfo.Split(':')
if ($credentials.Length -ne 2) {
  Write-Error "DATABASE_URL debe contener usuario y contraseña"
  exit 1
}

$dbHost = $uri.Host
$port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$username = $credentials[0]
$password = $credentials[1]
$database = $uri.AbsolutePath.TrimStart('/')
$backupDir = Join-Path $PSScriptRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$dateStamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$filename = "backup-$($database)-$dateStamp.sql"
$filepath = Join-Path $backupDir $filename

Write-Host "Generando backup de $database en $filepath"
$env:PGPASSWORD = $password

$pgDumpArgs = @(
  '--host', $dbHost,
  '--port', $port,
  '--username', $username,
  '--format', 'plain',
  '--file', $filepath,
  '--no-owner',
  '--no-privileges',
  $database
)

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = 'pg_dump'
$processInfo.Arguments = $pgDumpArgs -join ' '
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.UseShellExecute = $false
$processInfo.EnvironmentVariables['PGPASSWORD'] = $password

$process = [System.Diagnostics.Process]::Start($processInfo)
$process.StandardOutput.ReadToEnd() | Out-Null
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

if ($process.ExitCode -ne 0) {
  Write-Error "pg_dump falló: $stderr"
  exit $process.ExitCode
}

Write-Host "Backup finalizado correctamente."
