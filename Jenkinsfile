pipeline {
  agent any

  environment {
    GIT_REPO = 'https://github.com/AbdelrhmanAli123/devops-ci-jenkins-docker-sonarqube'
    GIT_BRANCH = 'main'
    SCANNER_HOME = tool 'sonarqube';  
    IMAGE_NAME = 'abdelrhmandevops/devops-gitops-project'
    IMAGE_TAG = "${IMAGE_NAME}:${BUILD_NUMBER}"
    
    scannerHome = tool 'sonarqube'
  }
    // use this stage if your repo is private otherwise don't declare this stage
    stages {
        stage("Code Checkout from Github") {
          steps {
            git credentialsId:'github_cred', url: "${GIT_REPO}", branch: "main"    // note: when you refer to the repo link with any variable, you must put this variable between double quotes
          }
      }
      
        stage('SonarQube analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonarqube'     // sonarqube global tool
                    withSonarQubeEnv('sonarqube_server') {        // and this is the sonarqube scanner that we passed the token in to authenticate jenkins into sonarqube server 
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=sonarqube \
                            -Dsonar.projectName=sonarqube \
                            -Dsonar.projectVersion=1.0 \
                            -Dsonar.sources=src/
                        """
                    }
                }
            }
        }
        stage('SonarQube quality gate') {
            steps {
                script {
                  timeout(time: 1, unite: 'HOURS'){
                  waitForQualityGate abortPipeline: true
                  }
                }
            }
        }



      
        stage('Build Docker Image and push it to DockerHub') {
            steps {
                    withCredentials([usernamePassword(credentialsId: 'docker_cred', passwordVariable: 'password', usernameVariable: 'username')]) {
                sh """ 
                    docker build . -t  ${IMAGE_NAME}:${BUILD_NUMBER}
                    docker login -u ${username} -p ${password}
                    docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                    """
                } 
            }
        }
         stage('Trigger Downstream Job') {
            steps {
                build(job: 'cd-pipeline', parameters: [
                    string(name: 'IMAGE_VERSION', value: "${IMAGE_TAG}")
                ])
            }
        }
    }
}
