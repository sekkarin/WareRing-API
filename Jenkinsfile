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
        sh 'apt-get update'
        sh 'apt-get upgrade'
        sh 'apt-get install -y nodejs'
      
      }
    }
    stage("Build"){
      steps{
        sh 'npm run build'
      }
    }
  }
}
