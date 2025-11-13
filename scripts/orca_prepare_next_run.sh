#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: orca_prepare_next_run.sh RUN_ID

RUN_ID: e.g. 20251120TorcaHttpLogZ1

Copies artifacts/orca-connectivity/template-next-run/RUN_ID_PLACEHOLDER
to artifacts/orca-connectivity/<RUN_ID> and renames any remaining
RUN_ID_PLACEHOLDER entries in file or directory names.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

RUN_ID="$1"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

TEMPLATE_ROOT="${REPO_ROOT}/artifacts/orca-connectivity/template-next-run"
TEMPLATE_DIR="${TEMPLATE_ROOT}/RUN_ID_PLACEHOLDER"
DEST_DIR="${REPO_ROOT}/artifacts/orca-connectivity/${RUN_ID}"

if [[ ! -d "${TEMPLATE_DIR}" ]]; then
  echo "テンプレートディレクトリが見つかりません: ${TEMPLATE_DIR}" >&2
  exit 1
fi

if [[ -e "${DEST_DIR}" ]]; then
  echo "出力先 ${DEST_DIR} は既に存在します。別の RUN_ID を指定するか、既存ディレクトリを確認してください。" >&2
  exit 1
fi

cp -R "${TEMPLATE_DIR}" "${DEST_DIR}"

while IFS= read -r -d '' path; do
  base="$(basename "${path}")"
  dir="$(dirname "${path}")"
  new_base="${base//RUN_ID_PLACEHOLDER/${RUN_ID}}"
  if [[ "${new_base}" != "${base}" ]]; then
    mv "${path}" "${dir}/${new_base}"
  fi
done < <(find "${DEST_DIR}" -depth -name '*RUN_ID_PLACEHOLDER*' -print0)

echo "テンプレートを ${DEST_DIR} に展開しました。"
