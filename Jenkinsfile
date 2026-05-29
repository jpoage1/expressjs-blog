pipeline {
    agent any

    environment {
        TARGET_BRANCH  = "${env.BRANCH_NAME ?: params.branch}"
        GIT_REPO       = 'ssh://git@git.jasonpoage.vpn:29418/jason/expressjs-blog.git'
        CREDENTIALS_ID = '08a57452-477d-4aa6-86c6-242553660b3f'
    }

    parameters {
        string(      name: 'branch',     defaultValue: 'refs/heads/main', description: 'Deployment branch')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false,             description: 'Skip integration tests')
        booleanParam(name: 'HOTFIX_MODE',defaultValue: false,             description: 'Pull and restart only — skip build')
        booleanParam(name: 'DRY_RUN',    defaultValue: false,             description: 'Print steps without executing')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def flags = [
                        "--branch ${env.TARGET_BRANCH}",
                        "--config /etc/expressjs-blog/deployment.lua",
                        params.HOTFIX_MODE  ? "--hotfix"      : "",
                        params.SKIP_TESTS   ? "--skip-tests"  : "",
                        params.DRY_RUN      ? "--dry-run"     : "",
                    ].findAll { it }.join(" ")

                    sh "bash deploy.sh ${flags}"
                }
            }
        }

    }

    post {
        success {
            echo "Deployment of ${env.TARGET_BRANCH} successful."
        }
        failure {
            echo "Deployment of ${env.TARGET_BRANCH} failed."
        }
    }
}
