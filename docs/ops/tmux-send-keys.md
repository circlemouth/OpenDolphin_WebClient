# tmux send-keys notify template (standard)

Purpose: prevent missed Enter and avoid silent no-op by always sending message then Enter in **two separate bash invocations**, with a mandatory one-shot confirmation.

## Script (standard: 2-bash calls)

Use `scripts/tmux-send-2step.sh`.

```bash
# STANDARD (MUST): two separate bash invocations.
# 1) send message (literal -l is enforced by script)
scripts/tmux-send-2step.sh msg <target-pane> '<message>'
# 2) send Enter + one-shot confirmation (MUST)
scripts/tmux-send-2step.sh enter <target-pane> --check --tail 40
```

Notes:
- MUST be sequential (no parallel execution). Do not run msg/enter in parallel.
- Prohibited: 1 command that mixes msg + Enter, `C-m`, or parallel msg/enter.

## Non-Standard (emergency only): notify in one bash invocation

`scripts/tmux-send-2step.sh notify` is supported, but it is **non-standard**. Use only in emergencies where a single invocation is unavoidable.

```bash
scripts/tmux-send-2step.sh notify <target-pane> '<message>'
```

## Manual template (if script not available)

```bash
# 1) message
tmux send-keys -t <target-pane> -l '<message>'
# 2) Enter
tmux send-keys -t <target-pane> Enter
# 3) one-shot confirm (mandatory)
tmux capture-pane -t <target-pane> -p | tail -n 40
```

## Target selection (must)

- target is `@agent_id` first.
  - example: `tmux display-message -t "$TMUX_PANE" -p '#{@agent_id}'`
- Alternatively use a fully qualified pane target: `<session>:<window>.<pane>`.

## Stop/Wait/Abort Protocol (MUST)

When you stop, wait, or abort work, do the following immediately before stopping (prevents "unreported stop"):

1. Update `queue/reports/ashigaru{N}_report.yaml`.
2. Notify Karo via tmux (message then Enter; 2 bash invocations).
3. Stop.

Minimal report fields:
- `worker_id`
- `task_id`
- `status`
- `timestamp`
- `result`
- `next_action`
- `last_run_id`

Notify template:

```bash
scripts/tmux-send-2step.sh msg @karo 'report.yaml updated: task_id=... status=... next_action=... RUN_ID=...'
scripts/tmux-send-2step.sh enter @karo --check --tail 40
```

## A/B/C/D safety checklist

A. Missing Enter (msg/Enter mismatch)
- Standard: 2-bash (msg then enter).
- Always keep one-shot confirmation (`enter --check --tail 40`).

B. Parallel execution (order collapse)
- Never run msg/enter in parallel.
- Never send msg+Enter in one command.

C. Wrong target
- Prefer `@agent_id`.
- If using pane target, use `<session>:<window>.<pane>` (not a broad target).
- Confirm via one-shot capture (built into `enter --check --tail 40`).

D. Special characters
- Always literal send (`-l`) and single quotes around `<message>`.

E. copy-mode (pane_in_mode=1)
- In copy-mode, inputs may be swallowed and `send-keys` can become a silent no-op.
- `scripts/tmux-send-2step.sh` refuses sending by default when `pane_in_mode=1`.
- Remedy: focus target pane, press `q` to exit copy-mode, then resend.
- Emergency only: `--force-exit-copy-mode` (script sends `q` once and continues).

## Incident note (cmd_20260206_19)

- Cause A: missed Enter.
- Ops: standardize msg then enter. In emergencies, suspect missing Enter and resend:
  - `scripts/tmux-send-2step.sh enter <target> --check --tail 40`

## Karo proof procedure (3 consecutive notifies)

```bash
scripts/tmux-send-2step.sh msg @karo 'test-1: tmux notify check'
scripts/tmux-send-2step.sh enter @karo --check --tail 40
scripts/tmux-send-2step.sh msg @karo 'test-2: tmux notify check'
scripts/tmux-send-2step.sh enter @karo --check --tail 40
scripts/tmux-send-2step.sh msg @karo 'test-3: tmux notify check'
scripts/tmux-send-2step.sh enter @karo --check --tail 40
```
