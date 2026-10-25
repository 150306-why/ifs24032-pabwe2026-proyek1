// Pipeline Toba Tix (monorepo: backend Express + frontend Vue).
// Alur mengikuti proyek contoh (ifs24032-pabwe2026-sk-p5-vue): paket ZIP -> publish ke
// Jenkins userContent -> request redeploy ke platform lewat API -> polling status.
// Bedanya: ada DUA paket (backend-app.zip dan frontend-app.zip), masing-masing dideploy ke website_id sendiri.
//
// Variabel yang harus tersedia di Jenkins (Manage Jenkins > System > Global properties > Environment variables),
// sama seperti proyek contoh, ditambah dua ID website:
//   URL_REDEPLOY, URL_PROGRESS, DEPLOY_TOKEN
//   WEBSITE_ID_BACKEND, WEBSITE_ID_FRONTEND
pipeline {

    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
        // Hentikan stage berikutnya jika build sudah UNSTABLE/FAILURE
        skipStagesAfterUnstable()
    }

    parameters {
        string(
            name: 'VITE_API_URL',
            defaultValue: 'http://localhost:3000/api',
            description: 'URL API backend yang sudah online (akhiri dengan /api). Ditanam ke frontend saat build.'
        )
        booleanParam(name: 'DEPLOY_BACKEND', defaultValue: true, description: 'Deploy paket backend')
        booleanParam(name: 'DEPLOY_FRONTEND', defaultValue: true, description: 'Deploy paket frontend')
    }

    environment {
        CI = 'true'
        VITE_API_URL = "${params.VITE_API_URL}"
        WEBSITE_ID_BACKEND = '<id-backend>'
        WEBSITE_ID_FRONTEND = '<id-frontend>'
    }

    stages {

        // ============================================================
        // CHECKOUT
        // ============================================================
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ============================================================
        // VALIDASI PARAMETER (gagal cepat sebelum buang waktu build)
        // ============================================================
        stage('Validate Parameters') {
            steps {
                script {
                    if (params.DEPLOY_FRONTEND && params.VITE_API_URL.contains('localhost')) {
                        error('VITE_API_URL masih localhost. Isi dengan URL backend online (.../api) atau matikan DEPLOY_FRONTEND.')
                    }
                    if (params.DEPLOY_BACKEND && !env.WEBSITE_ID_BACKEND) {
                        error('Environment variable WEBSITE_ID_BACKEND belum diisi di Jenkins.')
                    }
                    if (params.DEPLOY_FRONTEND && !env.WEBSITE_ID_FRONTEND) {
                        error('Environment variable WEBSITE_ID_FRONTEND belum diisi di Jenkins.')
                    }
                }
            }
        }

        // ============================================================
        // INSTALL DEPENDENCIES
        // ============================================================
        // Backend memakai npm di image Node: better-sqlite3 tidak bisa dipasang oleh bun
        // (binary siap pakai dilewati, lalu kompilasi gagal karena image bun tanpa Python/g++).
        stage('Install Backend') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                    args '-e HOME=/tmp -e npm_config_cache=/tmp/.npm'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "=== Install Backend ==="
                    cd backend
                    npm install --no-audit --no-fund
                '''
            }
        }

        stage('Install Frontend') {
            agent {
                docker {
                    image 'oven/bun:alpine'
                    reuseNode true
                    args '-e HOME=/tmp -e BUN_INSTALL_CACHE_DIR=/tmp/.bun-cache'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "=== Install Frontend ==="
                    cd frontend
                    bun install
                '''
            }
        }

        // ============================================================
        // LINT
        // ============================================================
        stage('Lint') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                    args '-e HOME=/tmp -e npm_config_cache=/tmp/.npm'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "=== Lint Backend ==="
                    (cd backend && npm run lint)

                    echo "=== Lint Frontend ==="
                    (cd frontend && npm run lint)
                '''
            }
        }

        // ============================================================
        // TEST BACKEND (Jest + Supertest, SQLite in-memory)
        // ============================================================
        stage('Test Backend') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                    args '-e HOME=/tmp -e npm_config_cache=/tmp/.npm'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "=== Backend Tests with Coverage ==="
                    cd backend
                    npm run test:ci

                    # Sonar membaca path relatif dari root repo: tambahkan prefix backend/ bila path relatif
                    sed -i -E 's#^SF:([^/])#SF:backend/\\1#' coverage/lcov.info
                '''
            }

            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/junit.xml'
                }
            }
        }

        // ============================================================
        // TEST FRONTEND (Vitest + Vue Test Utils)
        // ============================================================
        stage('Test Frontend') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                    args '-e HOME=/tmp -e npm_config_cache=/tmp/.npm'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "=== Frontend Tests with Coverage ==="
                    cd frontend
                    npm run test:ci

                    sed -i -E 's#^SF:([^/])#SF:frontend/\\1#' coverage/lcov.info
                '''
            }

            post {
                always {
                    junit allowEmptyResults: true, testResults: 'frontend/junit.xml'
                }
            }
        }

        // ============================================================
        // BUILD FRONTEND (memastikan build produksi berhasil)
        // ============================================================
        stage('Build Frontend') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                    args '-e HOME=/tmp -e npm_config_cache=/tmp/.npm'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "=== Build Frontend (VITE_API_URL=$VITE_API_URL) ==="
                    cd frontend
                    npm run build
                '''
            }
        }

        // ============================================================
        // TRIVY SECURITY SCAN
        // ============================================================
        stage('Trivy Security Scan') {
            agent {
                docker {
                    image 'aquasec/trivy:0.74.0'
                    reuseNode true

                    args '''
                        --entrypoint=""
                        -e HOME=/tmp
                        -e XDG_CACHE_HOME=/tmp/.cache
                    '''
                }
            }

            steps {
                sh '''
                    set -e

                    mkdir -p .trivy-cache || true

                    echo "======================================"
                    echo "        TRIVY SECURITY SCAN"
                    echo "======================================"

                    trivy --version

                    trivy fs \\
                        --cache-dir .trivy-cache \\
                        --scanners vuln \\
                        --severity HIGH,CRITICAL \\
                        --ignore-unfixed \\
                        --skip-dirs coverage \\
                        --skip-dirs .trivy-cache \\
                        --format sarif \\
                        --output trivy-results.sarif \\
                        --exit-code 1 \\
                        .

                    echo "=== Trivy Result ==="
                    ls -lh trivy-results.sarif
                '''
            }

            post {
                always {
                    // failOnError harus false: kegagalan karena HIGH/CRITICAL sudah ditangani oleh trivy --exit-code 1
                    recordIssues(
                        enabledForFailure: true,
                        failOnError: false,
                        tools: [
                            sarif(
                                id: 'trivy',
                                name: 'Trivy Security',
                                pattern: 'trivy-results.sarif'
                            )
                        ]
                    )
                }
            }
        }

        // ============================================================
        // SONARQUBE ANALYSIS
        // ============================================================
        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                    args '--network cicd-network'
                }
            }

            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        set -e

                        echo "=== SonarQube Analysis ==="
                        sonar-scanner
                        echo "=== SonarQube Analysis Completed ==="
                    '''
                }
            }
        }

        // ============================================================
        // QUALITY GATE
        // ============================================================
        stage('Quality Gate') {
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ============================================================
        // PACKAGE APPLICATION (dua paket ZIP)
        // ============================================================
        stage('Package Application') {
            agent {
                docker {
                    image 'node:24-alpine'
                    reuseNode true
                    args '-u root'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "======================================"
                    echo "       CREATING APPLICATION PACKAGES"
                    echo "======================================"

                    apk add --no-cache zip unzip

                    rm -f backend-app.zip frontend-app.zip

                    # Backend: isi folder backend/ berada di root ZIP. Secret (.env) dan database tidak ikut.
                    (cd backend && zip -r ../backend-app.zip . \\
                        -x "node_modules/*" \\
                        -x "coverage/*" \\
                        -x "data/*" \\
                        -x "*.db" -x "*.db-shm" -x "*.db-wal" \\
                        -x ".env" \\
                        -x "junit.xml")

                    # Frontend: VITE_API_URL ditanam lewat .env.production karena build dijalankan platform dari ZIP ini.
                    echo "VITE_API_URL=${VITE_API_URL}" > frontend/.env.production
                    (cd frontend && zip -r ../frontend-app.zip . \\
                        -x "node_modules/*" \\
                        -x "coverage/*" \\
                        -x "dist/*" \\
                        -x ".env" \\
                        -x "junit.xml")
                    rm -f frontend/.env.production

                    echo "=== Packages Created ==="
                    ls -lh backend-app.zip frontend-app.zip

                    echo "=== Backend Package Content ==="
                    unzip -l backend-app.zip | head -40
                    echo "=== Frontend Package Content ==="
                    unzip -l frontend-app.zip | head -40
                '''
            }
        }

        // ============================================================
        // PUBLISH APPLICATION
        // ============================================================
        stage('Publish Application') {

            steps {

                archiveArtifacts(
                    artifacts: 'backend-app.zip, frontend-app.zip',
                    fingerprint: true,
                    allowEmptyArchive: false
                )

                script {

                    def appName = env.JOB_NAME
                        .replaceAll('[^a-zA-Z0-9._-]', '-')
                        .replaceAll('-+', '-')
                        .replaceAll('^-|-$', '')

                    def buildId = env.BUILD_NUMBER

                    echo "Application Name: ${appName}"
                    echo "Build ID: ${buildId}"

                    def jenkinsBaseUrl = env.BUILD_URL
                        .substring(0, env.BUILD_URL.indexOf('/job/'))
                        .replace('localhost', 'host.docker.internal')

                    for (String part : ['backend', 'frontend']) {
                        sh """
                            set -e

                            echo "=== Publishing ${part}-app.zip ==="

                            docker exec cicd-jenkins \\
                                mkdir -p \\
                                "/var/jenkins_home/userContent/applications/${appName}/${buildId}"

                            docker cp \\
                                ${part}-app.zip \\
                                "cicd-jenkins:/var/jenkins_home/userContent/applications/${appName}/${buildId}/${part}-app.zip"

                            docker exec cicd-jenkins \\
                                ls -lh \\
                                "/var/jenkins_home/userContent/applications/${appName}/${buildId}/${part}-app.zip"
                        """
                    }

                    env.BACKEND_ARTIFACT_URL =
                        "${jenkinsBaseUrl}/userContent/applications/${appName}/${buildId}/backend-app.zip"
                    env.FRONTEND_ARTIFACT_URL =
                        "${jenkinsBaseUrl}/userContent/applications/${appName}/${buildId}/frontend-app.zip"

                    echo "Backend Artifact URL : ${env.BACKEND_ARTIFACT_URL}"
                    echo "Frontend Artifact URL: ${env.FRONTEND_ARTIFACT_URL}"
                }
            }
        }

        // ============================================================
        // DEPLOY APPLICATION (backend dulu, lalu frontend)
        // ============================================================
        stage('Deploy Application') {
            when {
                expression { return params.DEPLOY_BACKEND || params.DEPLOY_FRONTEND }
            }

            agent {
                docker {
                    image 'curlimages/curl:8.15.0'
                    reuseNode true
                    args '--network cicd-network'
                }
            }

            steps {
                script {
                    if (params.DEPLOY_BACKEND) {
                        deployZip('BACKEND', env.WEBSITE_ID_BACKEND, env.BACKEND_ARTIFACT_URL)
                    }
                    if (params.DEPLOY_FRONTEND) {
                        deployZip('FRONTEND', env.WEBSITE_ID_FRONTEND, env.FRONTEND_ARTIFACT_URL)
                    }
                }
            }
        }
    }

    // ================================================================
    // POST ACTIONS
    // ================================================================
    post {

        always {
            archiveArtifacts(
                artifacts: 'trivy-results.sarif',
                allowEmptyArchive: true
            )
        }

        success {
            echo "=========================================="
            echo "       PIPELINE SUCCESS"
            echo "=========================================="
            echo "Result: ${currentBuild.currentResult}"
            echo "Backend package : ${env.BACKEND_ARTIFACT_URL ?: '(not published)'}"
            echo "Frontend package: ${env.FRONTEND_ARTIFACT_URL ?: '(not published)'}"
        }

        failure {
            echo "=========================================="
            echo "       PIPELINE FAILED"
            echo "=========================================="
            echo "Periksa log stage yang merah / Console Output / Test Result."
        }

        unstable {
            echo "PIPELINE UNSTABLE: ${currentBuild.currentResult}"
        }
    }
}

// ====================================================================
// HELPER: request redeploy lalu polling progres (sama dengan proyek contoh)
// Dipanggil dari stage 'Deploy Application' (agent curl).
// ====================================================================
def deployZip(String label, String websiteId, String artifactUrl) {

    echo "=========================================="
    echo "   START DEPLOYMENT: ${label}"
    echo "=========================================="
    echo "Website ID  : ${websiteId}"
    echo "Artifact URL: ${artifactUrl}"

    // 1. REQUEST REDEPLOYMENT
    writeJSON file: 'deploy-request.json', json: [
        token_access: env.DEPLOY_TOKEN,
        website_id  : websiteId,
        source_url  : artifactUrl,
        source_type : 'jenkins'
    ]

    def redeployResponse = sh(
        script: '''
            set -e
            curl -sS --fail-with-body \\
                -X POST "$URL_REDEPLOY" \\
                -H "Content-Type: application/json" \\
                -d @deploy-request.json
        ''',
        returnStdout: true
    ).trim()

    sh 'rm -f deploy-request.json'

    echo "Redeploy Response (${label}):"
    echo redeployResponse

    // 2. POLLING DEPLOYMENT PROGRESS
    writeJSON file: 'deploy-progress.json', json: [
        token_access: env.DEPLOY_TOKEN,
        website_id  : websiteId
    ]

    def maxAttempts = 120
    def attempt = 0
    def deploymentStatus = 'IN_PROGRESS'

    try {
        while (deploymentStatus == 'IN_PROGRESS') {

            attempt++

            if (attempt > maxAttempts) {
                error("Deployment ${label} timeout. Status masih IN_PROGRESS setelah ${maxAttempts} percobaan.")
            }

            sleep time: 5, unit: 'SECONDS'

            echo "=== Checking ${label} Progress (${attempt}/${maxAttempts}) ==="

            def progressResponse = sh(
                script: '''
                    set -e
                    curl -sS --fail-with-body \\
                        -X POST "$URL_PROGRESS" \\
                        -H "Content-Type: application/json" \\
                        -d @deploy-progress.json
                ''',
                returnStdout: true
            ).trim()

            echo "Progress Response:"
            echo progressResponse

            def json = readJSON text: progressResponse

            deploymentStatus = json?.data?.status?.toString()?.toUpperCase()

            if (!deploymentStatus) {
                error('Response progress tidak memiliki data.status')
            }

            echo "Deployment Status (${label}): ${deploymentStatus}"

            if (deploymentStatus == 'SUCCESS') {
                echo "DEPLOYMENT ${label} SUCCESS"
                break
            }

            if (deploymentStatus == 'FAIL') {
                def deploymentLog = json?.data?.log ?: 'Deployment failed tanpa log.'
                echo "========== DEPLOYMENT LOG (${label}) =========="
                echo deploymentLog
                echo "=============================================="
                error("Deployment ${label} gagal untuk website ${websiteId}")
            }

            echo "Deployment ${label} masih berjalan..."
        }
    } finally {
        sh 'rm -f deploy-progress.json'
    }
}