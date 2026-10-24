// Pipeline deklaratif Toba Tix.
// VERIFIKASI di Jenkins Anda: nama instalasi NodeJS di 'tools' (Manage Jenkins > Tools) dan plugin
// NodeJS, JUnit, Pipeline. Alternatif tanpa plugin NodeJS: ganti agent dengan docker { image 'node:20' }
// (butuh plugin Docker Pipeline dan Docker di agent).
pipeline {
  agent any

  tools { nodejs 'node-20' }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    string(name: 'VITE_API_URL', defaultValue: 'http://localhost:3000/api', description: 'URL API untuk build frontend')
    booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Picu deploy hook setelah build sukses')
  }

  environment {
    CI = 'true'
    VITE_API_URL = "${params.VITE_API_URL}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      parallel {
        stage('Backend') {
          steps { dir('backend') { sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi' } }
        }
        stage('Frontend') {
          steps { dir('frontend') { sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi' } }
        }
      }
    }

    stage('Lint') {
      parallel {
        stage('Backend') {
          steps { dir('backend') { sh 'npm run lint' } }
        }
        stage('Frontend') {
          steps { dir('frontend') { sh 'npm run lint' } }
        }
      }
    }

    stage('Test') {
      parallel {
        stage('Backend (Jest)') {
          steps { dir('backend') { sh 'npm test' } }
          post { always { junit allowEmptyResults: true, testResults: 'backend/junit.xml' } }
        }
        stage('Frontend (Vitest)') {
          steps { dir('frontend') { sh 'npm run test:ci' } }
          post { always { junit allowEmptyResults: true, testResults: 'frontend/junit.xml' } }
        }
      }
    }

    stage('Build Frontend') {
      steps { dir('frontend') { sh 'npm run build' } }
    }

    stage('Archive') {
      steps { archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true }
    }

    stage('Deploy') {
      when { expression { return params.DEPLOY } }
      steps {
        // Buat credential tipe "Secret text" berisi URL deploy hook dari platform hosting Anda.
        withCredentials([
          string(credentialsId: 'BACKEND_DEPLOY_HOOK', variable: 'BACKEND_HOOK'),
          string(credentialsId: 'FRONTEND_DEPLOY_HOOK', variable: 'FRONTEND_HOOK')
        ]) {
          sh 'curl -fsS -X POST "$BACKEND_HOOK"'
          sh 'curl -fsS -X POST "$FRONTEND_HOOK"'
        }
      }
    }
  }

  post {
    success { echo 'BUILD SUKSES: lint, test, dan build frontend lulus.' }
    failure { echo 'BUILD GAGAL: lihat Console Output dan Test Result.' }
  }
}
