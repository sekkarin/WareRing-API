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
        sh 'npm install'
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
