pipeline {
    agent any

    environment {
        GIT_REPO = 'ssh://git@git.jasonpoage.vpn:29418/jason/express-blog.git'
        DEPLOY_BASE = '/srv/jasonpoage.com'
        YARN_ENABLE_GLOBAL_CACHE = 'false'
        YARN_CACHE_FOLDER = '/var/cache/jenkins/yarn'
        CREDENTIALS_ID = '08a57452-477d-4aa6-86c6-242553660b3f'
    }



    options {
        timestamps()
    }


    parameters {
        string(name: 'branch', defaultValue: 'refs/heads/testing', description: 'Branch ref from webhook')
        string(name: 'oldrev', defaultValue: '', description: 'old rev')
        string(name: 'newrev', defaultValue: '', description: 'new rev')

        booleanParam(name: 'SKIP_TESTS', defaultValue: true, description: 'Skip all testing')
    }
    stages {
        stage('Init') {
            steps {
                script {
                    if (params.branch?.startsWith("refs/heads/")) {
                        env.DEPLOY_BRANCH = params.branch.replaceFirst(/^refs\/heads\//, '')
                    } else {
                        error "Invalid branch ref: '${params.branch}'"
                    }

                    echo "==== DEBUG: Branch Param ===="
                    echo "params.branch: '${params.branch}'"
                    echo "env.DEPLOY_BRANCH: '${env.DEPLOY_BRANCH}'"

                    env.TIMESTAMP = sh(script: "date +%Y%m%d-%H%M%S", returnStdout: true).trim()
                    env.LOG_DIR = "${env.DEPLOY_BASE}/deployments/logs"
                    env.SERVER_LOG_FILE = "${env.LOG_DIR}/server/server-${env.TIMESTAMP}.log"
                    env.TEST_LOGS_FILE = "${env.LOG_DIR}/test-results/test-"
                    env.BUILD_DIR = "${env.WORKSPACE}/build"
                    env.ENV_FILE = "${env.DEPLOY_BASE}/env/${env.DEPLOY_BRANCH}.env"
                    env.SERVICE_NAME = "systemctl stop express-blog@${env.DEPLOY_BRANCH}.service"
                    env.DEPLOY_PATH = "${env.DEPLOY_BASE}/deployments/blog-${env.DEPLOY_BRANCH}"

                }
            }
        }

        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: "*/${env.DEPLOY_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: env.GIT_REPO,
                        credentialsId: '08a57452-477d-4aa6-86c6-242553660b3f'
                    ]]
                ])
            }
        }

        stage('Use Revs') {
            steps {
                script {
                    if (params.oldrev?.trim() && params.newrev?.trim()) {
                        env.OLD_REV = params.oldrev
                        env.NEW_REV = params.newrev
                    } else {
                        env.OLD_REV = sh(script: 'git rev-parse HEAD~1', returnStdout: true).trim()
                        env.NEW_REV = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    }
                }
                echo "==== DEBUG: Revisions ===="
                echo "params.oldrev: '${params.oldrev}'"
                echo "params.newrev: '${params.newrev}'"
                echo "Old revision: ${env.OLD_REV}"
                echo "New revision: ${env.NEW_REV}"
            }
        }

        stage('Validate Branch') {
            steps {
                script {
                    def allowed = ['testing', 'staging', 'main', 'production']
                    if (!allowed.contains(env.DEPLOY_BRANCH)) {
                        error "Branch '${env.DEPLOY_BRANCH}' is not allowed for deployment."
                    }
                }
            }
        }

        stage('Clone to Build Dir') {
            steps {
                script {
                    sh """
                        git clone --branch '${env.DEPLOY_BRANCH}' '${GIT_REPO}' '${BUILD_DIR}'
                    """
                }
            }
        }

        stage('Copy and Source .env') {
            steps {
                script {
                    env.ENV_FILE = "${DEPLOY_BASE}/env/${env.DEPLOY_BRANCH}.env"
                    env.LOG_FILE = "${LOG_DIR}/server/server-${env.TIMESTAMP}.log"

                    sh """
                        ln -s '${ENV_FILE}' '${BUILD_DIR}/.env'
                    """

                    def envVars = sh(
                        script: "set -a && . '${BUILD_DIR}/.env' && env | grep -E '^(SERVER_SCHEMA|SERVER_DOMAIN)='",
                        returnStdout: true
                    ).trim().split("\n")

                    def parsedEnv = [:]
                    envVars.each {
                        def (key, value) = it.tokenize('=')
                        parsedEnv[key] = value
                    }
                }
            }
        }

        stage('Initialize Submodules') {
            steps {
                sh """
                    cd '${BUILD_DIR}'
                    git submodule update --init --recursive
                """
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh """
                        cd '${BUILD_DIR}'
                        yarn
                    """
                }
            }
        }

        stage('Build CSS') {
            steps {
                sh """
                    cd '${BUILD_DIR}'
                    yarn combine:css
                """
            }
        }

        stage('Start Application for Test') {
            steps {
                script {
                    if ( !params.SKIP_TESTS ) {
                        env.PIDFILE = "${BUILD_DIR}/test.pid"
                        sh """
                            sudo systemctl stop express-blog@${env.DEPLOY_BRANCH}.service || true
                            cd '${BUILD_DIR}'
                            nohup node src/app.js >> '${LOG_FILE}' 2>&1 &
                            echo \$! > '${PIDFILE}'
                        """
                    }
                }
            }
        }

        stage('Wait for Service Readiness') {
            steps {
                script {
                    if ( !params.SKIP_TESTS ) {
                        def timeout = 30
                        def elapsed = 0
                        def success = false
                        while (elapsed < timeout) {
                            def result = sh(script: "curl --silent --fail '${env.SERVER_SCHEMA}://${env.SERVER_DOMAIN}' > /dev/null || true", returnStatus: true)
                            if (result == 0) {
                                success = true
                                break
                            }
                            sleep 1
                            elapsed += 1
                        }
                        if (!success) {
                            sh "cat '${LOG_FILE}'"
                            error "Service did not become available within ${timeout}s."
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    if ( !params.SKIP_TESTS ) {
                        def testStatus = sh(script: "cd '${BUILD_DIR}' && npm run test:postreceive", returnStatus: true)
                        if (testStatus != 0) {
                            sh "kill \$(cat '${PIDFILE}') || true"
                            sh "cat '${LOG_FILE}'"
                            error "Tests failed for branch ${env.DEPLOY_BRANCH}"
                        }
                    }
                }
            }
        }

        stage('Stop Test App') {
            steps {
                script {
                    if ( !params.SKIP_TESTS ) {
                        sh "kill \$(cat '${PIDFILE}') || true"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def DEPLOY_PATH = "${DEPLOY_BASE}/deployments/blog-${env.DEPLOY_BRANCH}"
                    if (env.DEPLOY_BRANCH == 'testing') {
                        sh """
                            rm -rf '${DEPLOY_PATH}' || true
                            mv '${BUILD_DIR}' '${DEPLOY_PATH}'
                            ln -sf '${ENV_FILE}' '${DEPLOY_PATH}/.env'
                        """
                    } else {
                        def dirExists = sh(script: "[ -d '${DEPLOY_PATH}' ] && echo 1 || echo 0", returnStdout: true).trim()
                        if (dirExists == "0") {
                            sh "git clone --branch '${env.DEPLOY_BRANCH}' '${GIT_REPO}' '${DEPLOY_PATH}'"
                        }

                        sh """
                            cd '${DEPLOY_PATH}'
                            git fetch origin
                            git reset --hard 'origin/${env.DEPLOY_BRANCH}'
                            git submodule update --init --recursive --force
                            ln -sf '${ENV_FILE}' '${DEPLOY_PATH}/.env'
                        """

                        def skipInstall = false
                        if (env.OLD_REV && env.NEW_REV && env.OLD_REV != "0000000000000000000000000000000000000000") {
                            def changed = sh(
                                script: "git --git-dir='${DEPLOY_PATH}/.git' diff-tree --name-only -r ${env.OLD_REV}..${env.NEW_REV}",
                                returnStdout: true
                            )
                            if (!changed.contains('package.json') && !changed.contains('yarn.lock')) {
                                skipInstall = true
                            }
                        }
                        skipInstall = false

                        if (!skipInstall) {
                            sh "cd '${DEPLOY_PATH}' && yarn"
                        } else {
                            echo "No dependency changes detected. Skipping yarn install."
                        }

                        sh "cd '${DEPLOY_PATH}' && yarn combine:css"
                    }
                }
            }
        }

       stage('Restart Service') {
            steps {
                script {
                    if (env.DEPLOY_BRANCH == 'main' || env.DEPLOY_BRANCH == 'production') {
                        sh "sudo systemctl restart express-blog@${env.DEPLOY_BRANCH}.service"
                    } else {
                        sh "sudo systemctl stop express-blog@${env.DEPLOY_BRANCH}.service || true"
                        sh "sudo systemctl start express-blog@${env.DEPLOY_BRANCH}.service"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment of ${env.DEPLOY_BRANCH} completed successfully."
        }
        failure {
            echo "Deployment of ${env.DEPLOY_BRANCH} failed."
        }
        cleanup {
            sh "rm -rf '${BUILD_DIR}' || true"
        }
    }
}
