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
        sh 'sudo apt-get install nodejs'
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
