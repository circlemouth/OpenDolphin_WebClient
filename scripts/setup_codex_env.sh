#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[codex-setup] $*"
}

cleanup_modernized_pom() {
  if [[ -n "${MODERNIZED_POM:-}" && -f "${MODERNIZED_POM}" ]]; then
    rm -f "${MODERNIZED_POM}"
  fi
}

prepare_modernized_parent_pom() {
  if [[ -n "${MODERNIZED_POM:-}" && -f "${MODERNIZED_POM}" ]]; then
    return
  fi

  if [[ ! -f "${REPO_ROOT}/pom.xml" ]]; then
    echo "pom.xml が見つからないため、モダナイズ版用の親 POM を生成できません" >&2
    exit 1
  fi

  local tmp_pom
  tmp_pom="$(mktemp "${REPO_ROOT}/.pom.server-modernized.XXXXXX.xml")"
  grep -v '<module>server</module>' "${REPO_ROOT}/pom.xml" \
    | grep -v '<module>client</module>' \
    > "${tmp_pom}"

  MODERNIZED_POM="${tmp_pom}"
  trap cleanup_modernized_pom EXIT
}

resolve_repo_root_from() {
  local path="$1"
  [[ -z "${path}" ]] && return 1
  [[ ! -d "${path}" ]] && return 1
  path="$(cd "${path}" && pwd)"
  while [[ -n "${path}" && "${path}" != "/" ]]; do
    if [[ -f "${path}/pom.xml" || -f "${path}/pom.server-modernized.xml" ]]; then
      if [[ -d "${path}/scripts" || -d "${path}/web-client" || -d "${path}/docs" ]]; then
        REPO_ROOT="${path}"
        return 0
      fi
      REPO_ROOT="${path}"
      return 0
    fi
    path="$(dirname "${path}")"
  done
  return 1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "このスクリプトは root 権限で実行してください。" >&2
    exit 1
  fi
}

ensure_repo_root() {
  local candidates=()
  local script_path script_dir candidate git_root

  if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
    script_path="$(readlink -f "${BASH_SOURCE[0]}")"
    script_dir="$(cd "$(dirname "${script_path}")" && pwd)"
    candidates+=( "$(cd "${script_dir}/.." && pwd)" )
  fi

  if [[ -n "${PWD:-}" ]]; then
    candidates+=( "$(pwd)" )
  fi

  if [[ -n "${REPO_ROOT:-}" ]]; then
    candidates+=( "${REPO_ROOT}" )
  fi

  if command -v git >/dev/null 2>&1; then
    if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
      candidates+=( "${git_root}" )
    fi
  fi

  local unique_candidates=()
  local seen=""
  for candidate in "${candidates[@]}"; do
    [[ -z "${candidate}" ]] && continue
    if [[ ! -d "${candidate}" ]]; then
      continue
    fi
    candidate="$(cd "${candidate}" && pwd)"
    if [[ "${seen}" == *"|${candidate}|"* ]]; then
      continue
    fi
    seen+="|${candidate}|"
    unique_candidates+=( "${candidate}" )
  done

  for candidate in "${unique_candidates[@]}"; do
    if resolve_repo_root_from "${candidate}"; then
      return
    fi
  done

  local search_bases=()
  if [[ -n "${HOME:-}" ]]; then
    search_bases+=( "${HOME}" )
  fi
  if [[ -n "${PWD:-}" ]]; then
    search_bases+=( "${PWD}" )
  fi
  if [[ -n "${script_dir:-}" && "${script_dir}" != "/" ]]; then
    search_bases+=( "${script_dir}" )
  fi
  if [[ -n "${MISE_PROJECT_DIR:-}" ]]; then
    search_bases+=( "${MISE_PROJECT_DIR}" )
  fi
  local default_bases=(
    "/workspace"
    "/workspaces"
    "/workdir"
    "/project"
    "/projects"
    "/home"
    "/Users"
  )
  for candidate in "${default_bases[@]}"; do
    if [[ -d "${candidate}" ]]; then
      search_bases+=( "${candidate}" )
    fi
  done

  local searched=""
  for base in "${search_bases[@]}"; do
    [[ -z "${base}" ]] && continue
    [[ ! -d "${base}" ]] && continue
    base="$(cd "${base}" && pwd)"
    if [[ "${searched}" == *"|${base}|"* ]]; then
      continue
    fi
    searched+="|${base}|"

    if [[ -d "${base}/OpenDolphin_WebClient" ]]; then
      if resolve_repo_root_from "${base}/OpenDolphin_WebClient"; then
        return
      fi
    fi

    if command -v rg >/dev/null 2>&1; then
      while IFS= read -r path; do
        local candidate_path
        local path_dir
        path_dir="$(dirname "${path}")"
        if [[ "${path}" != /* ]]; then
          candidate_path="$(cd "${base}" && cd "${path_dir}/.." && pwd 2>/dev/null)" || continue
        else
          candidate_path="$(cd "${path_dir}/.." && pwd 2>/dev/null)" || continue
        fi
        resolve_repo_root_from "${candidate_path}" && return
      done < <(rg --files -g 'setup_codex_env.sh' "${base}" 2>/dev/null || true)
    else
      while IFS= read -r path; do
        local candidate_path
        candidate_path="$(cd "$(dirname "${path}")/.." && pwd 2>/dev/null)" || continue
        resolve_repo_root_from "${candidate_path}" && return
      done < <(find "${base}" -maxdepth 6 -type f -name 'setup_codex_env.sh' 2>/dev/null || true)
    fi
  done

  echo "リポジトリルートを特定できませんでした。実行ディレクトリと scripts ディレクトリ構成を確認してください。" >&2
  exit 1
}

install_apt_packages() {
  export DEBIAN_FRONTEND=noninteractive
  log "APT パッケージインデックスを更新します"
  apt-get update

  local packages=(openjdk-17-jdk wget curl tar unzip ca-certificates)
  log "必要な APT パッケージをインストールします: ${packages[*]}"
  apt-get install -y "${packages[@]}"
}

install_maven() {
  local required_version="3.9.6"
  local install_dir="/opt/apache-maven-${required_version}"
  local archive="apache-maven-${required_version}-bin.tar.gz"
  local urls=(
    "https://archive.apache.org/dist/maven/maven-3/${required_version}/binaries/${archive}"
    "https://downloads.apache.org/maven/maven-3/${required_version}/binaries/${archive}"
    "https://dlcdn.apache.org/maven/maven-3/${required_version}/binaries/${archive}"
  )

  if command -v mvn >/dev/null 2>&1; then
    local current_version
    current_version="$(mvn -v | awk '/Apache Maven/ {print $3; exit}')"

    if [[ -n "${current_version}" ]]; then
      if dpkg --compare-versions "${current_version}" ge "${required_version}" 2>/dev/null || \
        [[ "$(printf '%s\n%s\n' "${current_version}" "${required_version}" | sort -V | tail -n1)" == "${current_version}" ]]; then
        log "Apache Maven ${current_version} は要件 (${required_version} 以上) を満たしています"
        return
      fi
    fi

    log "既存の Maven (${current_version:-不明}) を削除します"
    apt-get purge -y maven || true
  fi

  if [[ ! -d "${install_dir}" ]]; then
    log "Apache Maven ${required_version} をダウンロードします"
    local downloaded=false
    local tmp_err
    tmp_err="$(mktemp)"
    for url in "${urls[@]}"; do
      if curl -fsSL --retry 3 --retry-delay 2 "${url}" -o "/tmp/${archive}" 2>"${tmp_err}"; then
        downloaded=true
        break
      fi
      log "${url} からのダウンロードに失敗しました: $(tr -d '\n' <"${tmp_err}")"
    done
    rm -f "${tmp_err}"
    if [[ "${downloaded}" != true ]]; then
      echo "Apache Maven ${required_version} のダウンロードに失敗しました" >&2
      exit 1
    fi
    log "アーカイブを展開します"
    tar -xzf "/tmp/${archive}" -C /opt
    rm -f "/tmp/${archive}"
  fi

  log "mvn コマンドのシンボリックリンクを更新します"
  rm -f /usr/local/bin/mvn
  ln -sf "${install_dir}/bin/mvn" /usr/local/bin/mvn
}

configure_java_home() {
  local java_home
  java_home="$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")"
  if [[ -z "${java_home}" ]]; then
    echo "JAVA_HOME を特定できませんでした" >&2
    exit 1
  fi

  log "JAVA_HOME を ${java_home} に設定するプロファイルスクリプトを作成します"
  cat <<PROFILE >/etc/profile.d/opendolphin-java.sh
export JAVA_HOME=${java_home}
export PATH=\"\${JAVA_HOME}/bin:\${PATH}\"
PROFILE

  chmod 644 /etc/profile.d/opendolphin-java.sh
}

check_maven_connectivity() {
  log "Maven Central への疎通確認を実施します"
  if curl -Iv --max-time 5 https://repo.maven.apache.org/maven2/ >/tmp/codex-curl-maven.log 2>&1; then
    log "Maven Central への HTTPS 接続に成功しました"
    rm -f /tmp/codex-curl-maven.log
  else
    local curl_status=$?
    log "Maven Central への HTTPS 接続に失敗しました (curl exit ${curl_status})"
    log "curl の詳細ログ: /tmp/codex-curl-maven.log"
  fi
}

force_maven_ipv4() {
  local flag="-Djava.net.preferIPv4Stack=true"
  if [[ "${MAVEN_OPTS:-}" != *"${flag}"* ]]; then
    export MAVEN_OPTS="${MAVEN_OPTS:-} ${flag}"
    log "Maven 実行時に IPv4 を優先する設定を適用しました"
  else
    log "Maven 実行時の IPv4 優先設定は既に適用済みです"
  fi
}

install_ext_libraries() {
  pushd "${REPO_ROOT}" >/dev/null
  local ext_dir="${REPO_ROOT}/ext_lib"

  prepare_modernized_parent_pom

  local manual_artifacts=(
    "AppleJavaExtensions.jar:com.apple:AppleJavaExtensions:1.6"
    "iTextAsian.jar:opendolphin:itext-font:1.0"
  )

  for entry in "${manual_artifacts[@]}"; do
    IFS=':' read -r jar groupId artifactId version <<<"${entry}"
    local group_path="${groupId//./\/}"
    local target="${HOME}/.m2/repository/${group_path}/${artifactId}/${version}/${artifactId}-${version}.jar"

    if [[ -f "${target}" ]]; then
      log "${groupId}:${artifactId}:${version} は既にローカルリポジトリに存在します"
      continue
    fi

    log "${groupId}:${artifactId}:${version} をローカルリポジトリへ登録します"
    mvn -N -f "${MODERNIZED_POM}" -s ops/shared/docker/settings.xml \
      -B install:install-file \
      -Dfile="${ext_dir}/${jar}" \
      -DgroupId="${groupId}" \
      -DartifactId="${artifactId}" \
      -Dversion="${version}" \
      -Dpackaging=jar
  done
  popd >/dev/null
}

prime_modernized_server_dependencies() {
  pushd "${REPO_ROOT}" >/dev/null
  prepare_modernized_parent_pom
  log "server-modernized モジュールの依存関係を事前取得します"
  mvn -f "${MODERNIZED_POM}" -s ops/shared/docker/settings.xml \
    -pl server-modernized -am -DskipTests package
  popd >/dev/null
}

main() {
  require_root
  ensure_repo_root
  install_apt_packages
  install_maven
  configure_java_home
  check_maven_connectivity
  force_maven_ipv4
  install_ext_libraries
  prime_modernized_server_dependencies
  log "Codex 環境のセットアップが完了しました"
}

main "$@"
