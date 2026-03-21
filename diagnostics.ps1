"=== WARPALA FULL DIAGNOSTICS ===" | Out-File diagnostics_output.txt

"`n== PROJECT STRUCTURE ==" | Out-File diagnostics_output.txt -Append
tree /F | Out-File diagnostics_output.txt -Append

"`n== DISK USAGE ==" | Out-File diagnostics_output.txt -Append
Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object -First 50 Name,Length | Out-File diagnostics_output.txt -Append

"`n== NPM BUILD ==" | Out-File diagnostics_output.txt -Append
npm run build | Out-File diagnostics_output.txt -Append

"`n== TYPESCRIPT CHECK ==" | Out-File diagnostics_output.txt -Append
npx tsc --noEmit | Out-File diagnostics_output.txt -Append

"`n== DOCKER STATUS ==" | Out-File diagnostics_output.txt -Append
docker ps | Out-File diagnostics_output.txt -Append

"`n== DOCKER LOGS ==" | Out-File diagnostics_output.txt -Append
docker-compose logs | Out-File diagnostics_output.txt -Append

"`n=== DONE ===" | Out-File diagnostics_output.txt -Append

Write-Host "Diagnostics saved to diagnostics_output.txt"