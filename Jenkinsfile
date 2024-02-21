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
        sh 'apt install npm'
        sh 'npm install'
      }
    }
    stage("Build"){
      steps{
        sh 'npm run build'
      }
    }
  }
}
