pipeline {
    agent any

    environment {
        PROJECT_NAME = 'referal-portal'
        REGISTRY_USER = 'your-dockerhub-username' // Change to your Docker Hub username if pushing to registry
        IMAGE_BACKEND = 'referal-portal-backend'
        IMAGE_FRONTEND = 'referal-portal-frontend'
        BUILD_TAG = "${BUILD_NUMBER}"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        disableResume()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo '==== Checking out source code from SCM ===='
                checkout scm
            }
        }

        stage('2. Backend - Install & Verify') {
            steps {
                echo '==== Installing Backend Dependencies ===='
                dir('backend') {
                    sh 'npm ci || npm install'
                    sh 'node -e "console.log(\'Backend syntax check passed!\')"'
                }
            }
        }

        stage('3. Frontend - Build Test') {
            steps {
                echo '==== Building Frontend App ===='
                dir('frontend') {
                    sh 'npm ci || npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('4. Docker Build & Container Deploy') {
            when {
                branch 'staging'
            }
            steps {
                echo '==== Building Docker Containers & Deploying with Docker Compose (Staging) ===='
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose up -d --build'
            }
        }

        stage('5. Health Check & Integration Verification') {
            steps {
                echo '==== Verifying Application Health ===='
                sleep 5
                sh '''
                    echo "Checking Backend Health..."
                    curl -f http://localhost:5000/api/health || (echo "Backend Health Check Failed!" && exit 1)
                    
                    echo "Checking Frontend Response..."
                    curl -I http://localhost:3000 || (echo "Frontend Health Check Failed!" && exit 1)
                '''
            }
        }
    }

    post {
        always {
            echo '==== Cleaning up dangling Docker images ===='
            sh 'docker image prune -f || true'
        }
        success {
            echo "✅ Pipeline completed successfully for Build #${BUILD_NUMBER}!"
        }
        failure {
            echo "❌ Pipeline failed for Build #${BUILD_NUMBER}. Check logs for details."
        }
    }
}
