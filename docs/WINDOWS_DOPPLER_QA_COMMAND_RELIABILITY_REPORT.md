# Windows Doppler QA Command Reliability Report

## Scope

- Goal: make local QA command invocation resilient on this Windows machine when bare `doppler run` hits access-denied failures
- Runtime code changes: none
- Production behavior changes: none
- Secret values printed or stored: none

## Problem Observed

- Bare local `doppler run` occasionally fails in this shell with a Windows access-denied error
- The explicit WinGet-installed Doppler executable path works reliably in the same environment

## Local Resolution Strategy

Added `scripts/run-with-doppler.ps1` as a local-only command wrapper.

Resolution order:

1. `DOPPLER_BIN` if it points to an existing file
2. `Get-Command doppler`
3. Known WinGet install path:
   `C:\Users\esauk\AppData\Local\Microsoft\WinGet\Packages\Doppler.doppler_Microsoft.Winget.Source_8wekyb3d8bbwe\doppler.exe`

Behavior:

- passes through command arguments exactly
- does not print token or secret values
- fails with a clear setup message if Doppler cannot be resolved
- leaves the normal bare `doppler` workflow unchanged when it works

## Command Patterns

Canonical command when bare `doppler` works:

```powershell
doppler run -- node scripts/smoke-backend-supabase.mjs
```

Windows fallback when bare `doppler` is blocked:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs
```

Explicit environment override:

```powershell
$env:DOPPLER_BIN = "C:\\Users\\esauk\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Doppler.doppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\doppler.exe"
doppler run -- node scripts/smoke-backend-supabase.mjs
```

## Validation

- `npm.cmd run lint` passed
- `npm.cmd run build` passed
- `powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 --help` passes
- `powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs` passes with the resolved Doppler executable

## Outcome

- local QA scripts now have a documented Windows-safe Doppler invocation path
- bare `doppler run` remains the preferred command where it works
- no app runtime behavior was changed
