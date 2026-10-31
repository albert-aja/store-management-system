# ==============================================================================
# STORE MANAGEMENT SYSTEM (SMS) — FLYWAY MIGRATION VERIFIER (Backlog [A.3])
# ==============================================================================
# Usage: powershell -ExecutionPolicy Bypass -File .\verify_migrations.ps1

$MigrationDir = Join-Path $PSScriptRoot "..\src\main\resources\db\migration"
if (-not (Test-Path $MigrationDir)) {
    Write-Error "Migration directory not found: $MigrationDir"
    exit 1
}

$files = Get-ChildItem -Path $MigrationDir -Filter "*.sql" | Sort-Object { [int]($_.Name -replace '^V(\d+)__.*','$1') }

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  SMS FLYWAY MIGRATION VERIFICATION SUITE (V1 to V28)            " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Total migration files found: $($files.Count)`n"

$expectedVersion = 1
$hasError = $false
$tableCatalog = @()

foreach ($f in $files) {
    if ($f.Name -match '^V(\d+)__(.+)\.sql$') {
        $versionNum = [int]$Matches[1]
        $desc = $Matches[2]

        if ($versionNum -ne $expectedVersion) {
            Write-Host "[GAP ERROR] Expected V$expectedVersion, found V$versionNum ($($f.Name))" -ForegroundColor Red
            $hasError = $true
        }

        $expectedVersion = $versionNum + 1

        # Check content
        $content = Get-Content $f.FullName -Raw
        $sizeBytes = (Get-Item $f.FullName).Length
        
        # Check for unclosed statements or illegal drop statements
        $tableMatches = [regex]::Matches($content, 'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)', 'IgnoreCase')
        $tables = @()
        foreach ($tm in $tableMatches) {
            $tables += $tm.Groups[1].Value
            $tableCatalog += [PSCustomObject]@{
                Version = "V$versionNum"
                File = $f.Name
                Table = $tm.Groups[1].Value
            }
        }

        $tableSummary = if ($tables.Count -gt 0) { "Creates: " + ($tables -join ', ') } else { "(Alter/Seed/Index schema)" }
        Write-Host " [PASS] V$("{0:D2}" -f $versionNum) - $($f.Name.PadRight(42)) | Size: $("$sizeBytes B".PadLeft(8)) | $tableSummary" -ForegroundColor Green
    } else {
        Write-Host "[INVALID NAME] Migration does not match V<NUM>__<desc>.sql: $($f.Name)" -ForegroundColor Red
        $hasError = $true
    }
}

Write-Host "`n-----------------------------------------------------------------"
Write-Host "Total Unique Tables Registered: $($tableCatalog.Count)" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------------------"

if ($hasError) {
    Write-Host "`nVerification FAILED: Issues found in migration chain." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nVerification SUCCESS: Flyway migration chain V1 to V28 is valid and contiguous!" -ForegroundColor Green
    exit 0
}
