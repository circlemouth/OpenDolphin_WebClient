#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
差分に含まれる Java ファイルを対象に Checkstyle / PMD を実行します。

使い方:
  scripts/run-static-analysis-diff.sh [--cached] [--base <ref>] [--target <ref>]

オプション:
  --cached, --staged   ステージ済み変更のみを対象にする (git diff --cached 相当)
  --base <ref>         比較基準ブランチ/リビジョン (既定: origin/main)
  --target <ref>       比較対象ブランチ/リビジョン (既定: HEAD)
  -h, --help           このヘルプを表示

環境変数:
  MAVEN                mvn コマンドを上書きする場合に指定 (既定: mvn)
EOF
}

main() {
  local diff_mode="range"
  local base_ref="origin/main"
  local target_ref="HEAD"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cached|--staged)
        diff_mode="cached"
        shift
        ;;
      --base)
        [[ $# -ge 2 ]] || { echo "ERROR: --base の後に参照を指定してください" >&2; return 2; }
        base_ref="$2"
        shift 2
        ;;
      --target)
        [[ $# -ge 2 ]] || { echo "ERROR: --target の後に参照を指定してください" >&2; return 2; }
        target_ref="$2"
        shift 2
        ;;
      -h|--help)
        usage
        return 0
        ;;
      *)
        echo "ERROR: 未知の引数: $1" >&2
        usage >&2
        return 2
        ;;
    esac
  done

  command -v git >/dev/null 2>&1 || { echo "ERROR: git コマンドが見つかりません" >&2; return 2; }
  local mvn_cmd="${MAVEN:-mvn}"
  command -v "$mvn_cmd" >/dev/null 2>&1 || { echo "ERROR: mvn コマンドが見つかりません (MAVEN=${MAVEN:-})" >&2; return 2; }

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local project_root
  project_root="$(cd "${script_dir}/.." && pwd)"
  local pom_path="${project_root}/pom.server-modernized.xml"

  if [[ ! -f "$pom_path" ]]; then
    echo "ERROR: pom.server-modernized.xml が見つかりません (${pom_path})" >&2
    return 2
  fi

  local diff_filter="ACMRTUXB"
  local -a diff_paths=()

  if [[ "$diff_mode" == "cached" ]]; then
    mapfile -d '' diff_paths < <(git diff --cached --name-only -z "--diff-filter=${diff_filter}" -- '*.java')
  else
    mapfile -d '' diff_paths < <(git diff --name-only -z "--diff-filter=${diff_filter}" "${base_ref}" "${target_ref}" -- '*.java')
  fi

  if [[ "${#diff_paths[@]}" -eq 0 ]]; then
    echo "差分に Java ファイルがありません。処理を終了します。"
    return 0
  fi

  declare -A module_includes=()
  declare -A module_pretty=()

  local module
  local relative

  for path in "${diff_paths[@]}"; do
    case "$path" in
      common/*)
        module="common"
        relative="${path#common/}"
        ;;
      server-modernized/*)
        module="server-modernized"
        relative="${path#server-modernized/}"
        ;;
      *)
        continue
        ;;
    esac

    # Checkstyle/PMD の includes はカンマ区切りで指定する。
    if [[ -n "${module_includes[$module]:-}" ]]; then
      module_includes["$module"]+=",${relative}"
      module_pretty["$module"]+=$'\n'"  - ${relative}"
    else
      module_includes["$module"]="${relative}"
      module_pretty["$module"]="  - ${relative}"
    fi
  done

  if [[ "${#module_includes[@]}" -eq 0 ]]; then
    echo "対象モジュール (common/server-modernized) に変更された Java ファイルがありません。"
    return 0
  fi

  echo "差分対象ファイル:"
  for module in "${!module_includes[@]}"; do
    echo "モジュール: ${module}"
    printf '%s\n' "${module_pretty[$module]}"
  done

  local -a maven_common_args=(
    "-f" "$pom_path"
    "-Pstatic-analysis"
    "-DskipTests"
    "-B"
  )

  local exit_status=0

  for module in "${!module_includes[@]}"; do
    local includes="${module_includes[$module]}"

    echo ""
    echo "==> Running Checkstyle (${module})"
    if ! "$mvn_cmd" "${maven_common_args[@]}" -pl "$module" \
        -Dcheckstyle.skip=false \
        -Dcheckstyle.includes="${includes}" \
        checkstyle:checkstyle; then
      echo "Checkstyle 実行でエラーが発生しました (${module})" >&2
      exit_status=1
    fi

    echo ""
    echo "==> Running PMD (${module})"
    if ! "$mvn_cmd" "${maven_common_args[@]}" -pl "$module" \
        -Dpmd.skip=false \
        -Dpmd.includes="${includes}" \
        pmd:pmd; then
      echo "PMD 実行でエラーが発生しました (${module})" >&2
      exit_status=1
    fi
  done

  if [[ "$exit_status" -ne 0 ]]; then
    echo "静的解析でエラーが発生しました。上記ログを確認してください。" >&2
  else
    echo ""
    echo "Checkstyle / PMD の差分実行が完了しました。"
    echo "レポート: server-modernized/target/static-analysis/(checkstyle|pmd) を参照してください。"
  fi

  return "$exit_status"
}

main "$@"
