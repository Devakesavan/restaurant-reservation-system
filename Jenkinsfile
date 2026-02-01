pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Code already checked out from GitHub'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t devakesavan/restaurant-reservation-backend:latest backend'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t devakesavan/restaurant-reservation-frontend:latest frontend'
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh '''
                  docker push devakesavan/restaurant-reservation-backend:latest
                  docker push devakesavan/restaurant-reservation-frontend:latest
                '''
            }
        }
    }
}