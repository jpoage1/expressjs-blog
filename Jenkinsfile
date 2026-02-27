pipeline {
    agent any

    environment {
        // Map the branch name from the webhook or manual trigger
        // If BRANCH_NAME is not set, we use the parameter
        TARGET_BRANCH = "${env.BRANCH_NAME ?: params.branch}"
        GIT_REPO = 'ssh://git@git.jasonpoage.vpn:29418/jason/express-blog.git'
        CREDENTIALS_ID = '08a57452-477d-4aa6-86c6-242553660b3f'
    }

    parameters {
        string(name: 'branch', defaultValue: 'refs/heads/main', description: 'Deployment branch')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip integration tests')
        booleanParam(name: 'HOTFIX_MODE', defaultValue: true, description: 'Skip cloning/installing; pull and restart only')
    }

    stages {
        stage('Setup Runner') {
          steps {
              checkout scm
              sh """
                  python3 -m venv .venv
                  ./.venv/bin/pip install -r requirements.txt
              """
          }
      }

      stage('Execute Deployment') {
          steps {
              script {
                  def mode = params.HOTFIX_MODE ? "--hotfix" : ""
                  def skipFlag = params.SKIP_TESTS ? "--skip-tests" : ""
                  // Call the python binary inside the venv directly
                  sh "./.venv/bin/python3 -u ./deployment --config /srv/jasonpoage.com/deployment.lua --branch ${env.TARGET_BRANCH} ${skipFlag} ${mode}"
              }
          }
      }
    }

    post {
        always {
            // Clean up the build directory in the workspace to prevent the "already exists" error
            sh "rm -rf build/"
        }
        success {
            echo "Deployment of ${env.TARGET_BRANCH} successful."
        }
        failure {
            echo "Deployment of ${env.TARGET_BRANCH} failed. Check Python logs above."
        }
    }
}
