#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[codex-setup] $*"
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "このスクリプトは root 権限で実行してください。" >&2
    exit 1
  fi
}

ensure_repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "${script_dir}/.." && pwd)"
  if [[ ! -f "${REPO_ROOT}/pom.xml" ]]; then
    echo "リポジトリルートで実行できません。scripts ディレクトリ構成を確認してください。" >&2
    exit 1
  fi
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
    "https://dlcdn.apache.org/maven/maven-3/${required_version}/binaries/${archive}"
    "https://archive.apache.org/dist/maven/maven-3/${required_version}/binaries/${archive}"
  )

  if command -v mvn >/dev/null 2>&1; then
    local current_version
    current_version="$(mvn -v | awk '/Apache Maven/ {print $3; exit}')"
    if [[ "${current_version}" == "${required_version}" ]]; then
      log "Apache Maven ${required_version} は既に利用可能です"
      ln -sf "${install_dir}/bin/mvn" /usr/local/bin/mvn 2>/dev/null || true
      return
    fi
    log "既存の Maven (${current_version}) を削除します"
    apt-get purge -y maven || true
  fi

  if [[ ! -d "${install_dir}" ]]; then
    log "Apache Maven ${required_version} をダウンロードします"
    local downloaded=false
    for url in "${urls[@]}"; do
      if curl -fsSL "${url}" -o "/tmp/${archive}"; then
        downloaded=true
        break
      fi
      log "${url} からのダウンロードに失敗しました。別ミラーを試行します"
    done
    if [[ "${downloaded}" != true ]]; then
      echo "Apache Maven ${required_version} のダウンロードに失敗しました" >&2
      exit 1
    fi
    log "アーカイブを展開します"
    tar -xzf "/tmp/${archive}" -C /opt
    rm -f "/tmp/${archive}"
  fi

  log "mvn コマンドのシンボリックリンクを更新します"
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

install_ext_libraries() {
  pushd "${REPO_ROOT}" >/dev/null
  local ext_dir="${REPO_ROOT}/ext_lib"

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
    mvn install:install-file \
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
  log "server-modernized モジュールの依存関係を事前取得します"
  mvn -pl server-modernized -am -DskipTests package
  popd >/dev/null
}

main() {
  require_root
  ensure_repo_root
  install_apt_packages
  install_maven
  configure_java_home
  install_ext_libraries
  prime_modernized_server_dependencies
  log "Codex 環境のセットアップが完了しました"
}

main "$@"
