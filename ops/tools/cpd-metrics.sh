#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
cpd-metrics.sh

Copy/Paste Detector (CPD) の XML レポートから集計メトリクスを抽出し、BigQuery 取り込み用の JSON を生成するユーティリティ。

使用例:
  ops/tools/cpd-metrics.sh --cpd-xml server-modernized/target/site/cpd.xml \
    --job-name Server-Modernized-Static-Analysis-Nightly \
    --build-number 42 \
    --build-url https://jenkins.example/job/Server-Modernized-Static-Analysis-Nightly/42/ \
    --git-branch main \
    --git-commit abcdef123 \
    --output cpd-metrics.json

オプション:
  --cpd-xml PATH        解析対象の CPD XML レポートパス（必須）
  --job-name NAME       Jenkins ジョブ名などの識別子
  --build-number NUM    ビルド番号（数値）
  --build-url URL       ビルド詳細ページの URL
  --git-branch BRANCH   対象ブランチ名
  --git-commit HASH     対象コミットのハッシュ
  --generated-at TS     集計タイムスタンプ（ISO 8601）。指定が無い場合は UTC 現在時刻。
  --output PATH         出力先ファイル。省略時は標準出力へ書き込む。
  --help                このヘルプを表示。
EOF
}

CPD_XML=""
JOB_NAME=""
BUILD_NUMBER=""
BUILD_URL=""
GIT_BRANCH=""
GIT_COMMIT=""
GENERATED_AT=""
OUTPUT="-"
REPO_ROOT="${REPO_ROOT:-$(pwd)}"
REPO_ROOT="${REPO_ROOT%/}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cpd-xml)
      CPD_XML="${2:-}"
      shift 2
      ;;
    --job-name)
      JOB_NAME="${2:-}"
      shift 2
      ;;
    --build-number)
      BUILD_NUMBER="${2:-}"
      shift 2
      ;;
    --build-url)
      BUILD_URL="${2:-}"
      shift 2
      ;;
    --git-branch)
      GIT_BRANCH="${2:-}"
      shift 2
      ;;
    --git-commit)
      GIT_COMMIT="${2:-}"
      shift 2
      ;;
    --generated-at)
      GENERATED_AT="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT="${2:-}"
      shift 2
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "未対応の引数: $1" >&2
      show_help >&2
      exit 1
      ;;
  esac
done

if [[ -z "$CPD_XML" ]]; then
  echo "--cpd-xml は必須です。" >&2
  exit 1
fi

if [[ ! -f "$CPD_XML" ]]; then
  echo "指定された CPD XML が存在しません: $CPD_XML" >&2
  exit 1
fi

if [[ -z "$GENERATED_AT" ]]; then
  GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
fi

readarray -t METRIC_LINES < <(awk -v repo_root="$REPO_ROOT" '
  function record_path(raw_attr) {
    path = raw_attr
    gsub(/^[[:space:]]+/, "", path)
    sub(/^[Pp][Aa][Tt][Hh]="?/, "", path)
    sub(/"$/, "", path)
    gsub(/\r/, "", path)
    if (repo_root != "" && index(path, repo_root "/") == 1) {
      path = substr(path, length(repo_root) + 2)
    }
    if (length(path) > 0) {
      files[path] = 1
    }
  }

  /<duplication[[:space:]]/ {
    duplication_count++
    if (match($0, /lines="[0-9]+"/)) {
      value = substr($0, RSTART, RLENGTH)
      sub(/^lines="/, "", value)
      sub(/"$/, "", value)
      duplicate_lines += value + 0
    }
    in_dup = 1
    next
  }

  in_dup && /<\/duplication>/ {
    in_dup = 0
    next
  }

  in_dup && /path="[^"]+"/ {
    if (match($0, /path="[^"]+"/)) {
      record_path(substr($0, RSTART, RLENGTH))
    }
    next
  }

  END {
    for (path in files) {
      file_count++
      module = path
      sub("/.*", "", module)
      module_counts[module]++
    }

    printf("duplicate_lines=%d\n", duplicate_lines)
    printf("duplication_count=%d\n", duplication_count)
    printf("file_count=%d\n", file_count)
    for (module in module_counts) {
      printf("module[%s]=%d\n", module, module_counts[module])
    }
  }
' "$CPD_XML")

DUPLICATE_LINES=0
DUPLICATION_COUNT=0
FILE_COUNT=0
declare -A MODULE_COUNTS=()

for line in "${METRIC_LINES[@]}"; do
  if [[ "$line" =~ ^duplicate_lines=([0-9]+)$ ]]; then
    DUPLICATE_LINES="${BASH_REMATCH[1]}"
  elif [[ "$line" =~ ^duplication_count=([0-9]+)$ ]]; then
    DUPLICATION_COUNT="${BASH_REMATCH[1]}"
  elif [[ "$line" =~ ^file_count=([0-9]+)$ ]]; then
    FILE_COUNT="${BASH_REMATCH[1]}"
  elif [[ "$line" =~ ^module\[([^]]+)\]=([0-9]+)$ ]]; then
    MODULE_COUNTS["${BASH_REMATCH[1]}"]="${BASH_REMATCH[2]}"
  fi
done

MODULES_JSON="$(jq -n '[]')"
for module in "${!MODULE_COUNTS[@]}"; do
  count="${MODULE_COUNTS[$module]}"
  MODULES_JSON="$(jq --arg name "$module" --argjson file_count "$count" '. + [{name: $name, file_count: $file_count}]' <<<"$MODULES_JSON")"
done

if [[ -n "$BUILD_NUMBER" ]]; then
  BUILD_NUMBER_JSON="$BUILD_NUMBER"
else
  BUILD_NUMBER_JSON="null"
fi

SUMMARY_JSON="$(jq -n \
  --arg job_name "$JOB_NAME" \
  --arg build_url "$BUILD_URL" \
  --arg git_branch "$GIT_BRANCH" \
  --arg git_commit "$GIT_COMMIT" \
  --arg generated_at "$GENERATED_AT" \
  --argjson build_number "$BUILD_NUMBER_JSON" \
  --argjson duplicate_lines "$DUPLICATE_LINES" \
  --argjson duplication_count "$DUPLICATION_COUNT" \
  --argjson file_count "$FILE_COUNT" \
  --argjson modules "$MODULES_JSON" \
  '{
    job_name: $job_name,
    build_number: $build_number,
    build_url: $build_url,
    git_branch: $git_branch,
    git_commit: $git_commit,
    generated_at: $generated_at,
    duplicate_lines: $duplicate_lines,
    duplication_count: $duplication_count,
    file_count: $file_count,
    modules: $modules
  }'
)"

if [[ "$OUTPUT" == "-" ]]; then
  printf '%s\n' "$SUMMARY_JSON"
else
  printf '%s\n' "$SUMMARY_JSON" >"$OUTPUT"
fi
