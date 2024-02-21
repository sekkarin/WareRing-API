pipeline {
  agent any
  stages {
    stage("checkout"){
      steps{
        checkout scm
      }
    }
    stage("Test"){
      steps{
        sh 'sudo apt install npm'
        sh 'npm run test:e2e'
      }
    }
    stage("Build"){
      steps{
        sh 'npm run build'
      }
    }
  }
}
