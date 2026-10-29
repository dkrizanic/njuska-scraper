# Register Daily Windows Scheduled Task for Njuškalo Real Estate Scraper
# Runs every day at 03:00 AM using the project's virtual environment.

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PythonExe = "$RepoRoot\.venv\Scripts\python.exe"
$TaskName = "NjuskaloDailyRealEstateScraper"

$Action = New-ScheduledTaskAction `
    -Execute $PythonExe `
    -Argument "server/cron/daily_scheduler.py" `
    -WorkingDirectory $RepoRoot

$Trigger = New-ScheduledTaskTrigger -Daily -At "03:00AM"

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 12)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Daily Njuškalo Real Estate scraper storing prices, price history, views/visits, and seller metrics into PostgreSQL." `
    -Force

Write-Host "✔ Daily scheduled task '$TaskName' registered to run daily at 03:00 AM!" -ForegroundColor Green
