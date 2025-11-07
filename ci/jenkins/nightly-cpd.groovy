pipeline {
  agent { label 'maven-jdk17' }
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(daysToKeepStr: '30', artifactDaysToKeepStr: '30'))
  }
  triggers {
    cron('H 3 * * *')
  }
  environment {
    CPD_XML = 'server-modernized/target/site/cpd.xml'
    CPD_HTML = 'server-modernized/target/site/cpd.html'
    CPD_ADDITIONAL_XML = 'server-modernized/target/static-analysis/pmd/**/*.xml'
    METRICS_JSON = 'cpd-metrics.json'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Static Analysis - CPD') {
      steps {
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
          sh '''#!/bin/bash
set -euo pipefail
mvn -f pom.server-modernized.xml -Pstatic-analysis pmd:cpd -Dcpd.failOnViolation=false -B
'''
        }
      }
    }
    stage('Collect Metrics') {
      steps {
        script {
          Map<String, Object> metrics = [
            jobName       : env.JOB_NAME,
            buildNumber   : env.BUILD_NUMBER?.toInteger(),
            buildUrl      : env.BUILD_URL,
            gitBranch     : env.BRANCH_NAME ?: env.GIT_BRANCH ?: '',
            gitCommit     : env.GIT_COMMIT ?: '',
            generatedAtUtc: java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC).toString(),
            duplicateLines: 0,
            duplicationCount: 0,
            fileCount     : 0,
            modules       : [:]
          ]

          if (fileExists(env.CPD_XML)) {
            def xml = new XmlSlurper().parse(env.CPD_XML)
            Set<String> uniqueFiles = new LinkedHashSet<>()
            Map<String, Set<String>> moduleFiles = [:].withDefault { new LinkedHashSet<String>() }

            xml.duplication.each { duplication ->
              String linesAttr = duplication.@lines?.text() ?: '0'
              metrics.duplicationCount = metrics.duplicationCount + 1
              metrics.duplicateLines = metrics.duplicateLines + (linesAttr.isInteger() ? linesAttr.toInteger() : 0)
              duplication.file.each { fileNode ->
                String path = fileNode.@path?.text() ?: ''
                if (path) {
                  uniqueFiles << path
                  String moduleName = path.contains('/') ? path.split('/')[0] : path
                  moduleFiles[moduleName] << path
                }
              }
            }

            metrics.fileCount = uniqueFiles.size()
            metrics.modules = moduleFiles.collectEntries { key, value ->
              [(key): value.size()]
            }
          }

          String metricsJson = groovy.json.JsonOutput.prettyPrint(groovy.json.JsonOutput.toJson(metrics))
          writeFile file: env.METRICS_JSON, text: metricsJson
        }
      }
    }
    stage('Archive Reports') {
      steps {
        script {
          if (fileExists(env.METRICS_JSON)) {
            archiveArtifacts artifacts: env.METRICS_JSON, fingerprint: true, allowEmptyArchive: false
          }
          if (fileExists(env.CPD_XML)) {
            archiveArtifacts artifacts: env.CPD_XML, fingerprint: true, allowEmptyArchive: false
          }
          if (fileExists(env.CPD_HTML)) {
            archiveArtifacts artifacts: env.CPD_HTML, fingerprint: true, allowEmptyArchive: false
          }
          // CPD がモジュール単位の XML を出力する場合に備えてワイルドカードで保存
          archiveArtifacts artifacts: env.CPD_ADDITIONAL_XML, fingerprint: true, allowEmptyArchive: true
        }
      }
    }
    stage('Notify') {
      steps {
        script {
          Map<String, Object> metrics = [:]
          if (fileExists(env.METRICS_JSON)) {
            metrics = new groovy.json.JsonSlurper().parseText(readFile(env.METRICS_JSON)) as Map<String, Object>
          }

          String modulesSummary = ''
          if (metrics.modules instanceof Map) {
            modulesSummary = metrics.modules.collect { key, value -> "${key}: ${value}" }.join(', ')
          }

          boolean isFailure = currentBuild.currentResult != 'SUCCESS'
          String jobLabel = "${env.JOB_NAME} #${env.BUILD_NUMBER}"
          String artifactsUrl = env.BUILD_URL ? "${env.BUILD_URL}artifact/" : ''

          String slackText
          if (isFailure) {
            slackText = """Nightly CPD ジョブが失敗しました: ${jobLabel}
${env.BUILD_URL ?: ''}
"""
            if (metrics) {
              slackText += """直前に取得できたメトリクス:
- 重複行数: ${metrics.duplicateLines ?: 0}
- 重複ファイル数: ${metrics.fileCount ?: 0}
- モジュール別件数: ${modulesSummary ?: 'N/A'}
"""
            }
          } else {
            slackText = """Nightly CPD 成功: ${jobLabel}
- 重複行数: ${metrics.duplicateLines ?: 0}
- 重複ファイル数: ${metrics.fileCount ?: 0}
- 重複グループ数: ${metrics.duplicationCount ?: 0}
- モジュール別件数: ${modulesSummary ?: 'N/A'}
アーティファクト: ${artifactsUrl}
"""
          }

          withCredentials([string(credentialsId: 'slack-static-analysis-webhook', variable: 'SLACK_WEBHOOK_URL')]) {
            if (env.SLACK_WEBHOOK_URL?.trim()) {
              String slackPayload = groovy.json.JsonOutput.toJson([text: slackText])
              writeFile file: 'slack_payload.json', text: slackPayload
              sh '''#!/bin/bash
set -euo pipefail
curl -s -X POST -H 'Content-type: application/json' --data @slack_payload.json "$SLACK_WEBHOOK_URL" >/dev/null
rm -f slack_payload.json
'''
            }
          }

          if (isFailure) {
            withCredentials([string(credentialsId: 'pagerduty-static-analysis-routing-key', variable: 'PAGERDUTY_ROUTING_KEY')]) {
              if (env.PAGERDUTY_ROUTING_KEY?.trim()) {
                Map<String, Object> pagerDutyPayload = [
                  routing_key : env.PAGERDUTY_ROUTING_KEY,
                  event_action: 'trigger',
                  dedup_key   : "nightly-cpd-${env.JOB_NAME}-${env.BUILD_NUMBER}",
                  payload     : [
                    summary       : "Nightly CPD ジョブ失敗: ${jobLabel}",
                    severity      : 'error',
                    source        : env.JENKINS_URL ?: 'jenkins',
                    component     : 'server-modernized',
                    group         : 'static-analysis',
                    custom_details: [
                      build_url            : env.BUILD_URL,
                      git_branch           : env.BRANCH_NAME ?: env.GIT_BRANCH ?: '',
                      git_commit           : env.GIT_COMMIT ?: '',
                      duplicate_lines      : metrics.duplicateLines ?: 0,
                      duplicated_file_count: metrics.fileCount ?: 0
                    ]
                  ],
                  links       : [[
                    href: env.BUILD_URL,
                    text: 'Jenkins Build'
                  ]]
                ]
                writeFile file: 'pagerduty_payload.json', text: groovy.json.JsonOutput.toJson(pagerDutyPayload)
                sh '''#!/bin/bash
set -euo pipefail
curl -s -X POST -H 'Content-Type: application/json' --data @pagerduty_payload.json https://events.pagerduty.com/v2/enqueue >/dev/null
rm -f pagerduty_payload.json
'''
              }
            }
          }
        }
      }
    }
  }
}
