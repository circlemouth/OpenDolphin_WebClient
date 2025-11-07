pipeline {
  agent { label 'maven-jdk17' }
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }
  environment {
    STATIC_ANALYSIS_REPORT_DIR = 'server-modernized/target/static-analysis'
    DEFAULT_BASE_REF = 'origin/main'
  }
  stages {
    stage('Static Analysis - Full') {
      steps {
        sh '''#!/bin/bash
set -euo pipefail
mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests -B
'''
        archiveArtifacts artifacts: "${STATIC_ANALYSIS_REPORT_DIR}/**/*", fingerprint: true, allowEmptyArchive: true
      }
    }
    stage('Static Analysis - Diff Gate') {
      steps {
        script {
          String changeTarget = env.CHANGE_TARGET?.trim()
          String fetchRef = changeTarget ?: 'main'
          String baseRef = changeTarget ? "origin/${changeTarget}" : env.DEFAULT_BASE_REF
          sh """#!/bin/bash
set -euo pipefail
git fetch origin ${fetchRef} --depth=1
scripts/run-static-analysis-diff.sh --base ${baseRef} --target HEAD
"""
        }
      }
    }
  }
  post {
    failure {
      script {
        String jobLabel = "${env.JOB_NAME} #${env.BUILD_NUMBER}"
        String slackMessage = "静的解析ジョブが失敗しました: ${jobLabel}\\n${env.BUILD_URL}"
        withCredentials([string(credentialsId: 'slack-static-analysis-webhook', variable: 'SLACK_WEBHOOK_URL')]) {
          if (env.SLACK_WEBHOOK_URL?.trim()) {
            String slackPayload = groovy.json.JsonOutput.toJson([text: slackMessage])
            writeFile file: 'slack_payload.json', text: slackPayload
            sh '''#!/bin/bash
set -euo pipefail
curl -s -X POST -H 'Content-type: application/json' --data @slack_payload.json "$SLACK_WEBHOOK_URL" >/dev/null
rm -f slack_payload.json
'''
          }
        }
        withCredentials([string(credentialsId: 'pagerduty-static-analysis-routing-key', variable: 'PAGERDUTY_ROUTING_KEY')]) {
          if (env.PAGERDUTY_ROUTING_KEY?.trim()) {
            Map<String, Object> pagerDutyPayload = [
              routing_key : env.PAGERDUTY_ROUTING_KEY,
              event_action: 'trigger',
              dedup_key   : "static-analysis-${env.JOB_NAME}-${env.BUILD_NUMBER}",
              payload     : [
                summary       : "静的解析ジョブ失敗: ${jobLabel}",
                severity      : 'error',
                source        : env.JENKINS_URL ?: 'jenkins',
                component     : 'server-modernized',
                group         : 'static-analysis',
                custom_details: [
                  build_url : env.BUILD_URL,
                  git_branch: env.BRANCH_NAME ?: env.GIT_BRANCH ?: '',
                  git_commit: env.GIT_COMMIT ?: '',
                  base_ref  : env.CHANGE_TARGET ?: 'main'
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
