# ORCA connectivity RUN_ID=20251121SeedFixZ1

## Summary
- Registered patient via `/api/orca12/patientmodv2?class=01` using auto numbering (`Patient_ID=*`) -> `Api_Result=00`, assigned `Patient_ID=00001`.
- Doctor master for code `0001` not present; `/api01rv2/system01lstv2?class=02` returns `Api_Result=11` (no entries).
- Attempts to create acceptance (`/api/orca11/acceptmodv2?class=01`), appointment list (`/api01rv2/appointlstv2?class=01`), and medical record (`/api/api21/medicalmodv2?class=01`) all blocked with doctor missing errors.

## Evidence layout
- `crud/patientmodv2/`: request/response/headers for patient registration (assigned `00001`).
- `crud/acceptmodv2/`, `crud/acceptlstv2/`, `crud/appointlstv2/`, `crud/medicalmodv2/`: requests/responses showing doctor missing / no acceptance records.
- `trace/system01lstv2*/`: doctor list fetch attempts (`Base_Date=2025-11-21` and `2024-01-01`), `Api_Result=11`.
- `blocked/patientmodv2-api/`: initial attempts with explicit patient IDs (`00000001`, etc.) returning `P1` (digit/serial errors).

Passwords in logs are masked via Basic Auth handling by curl.
