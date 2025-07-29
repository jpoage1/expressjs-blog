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
                    env.PIDFILE = "${BUILD_DIR}/test.pid"
                    env.ENV_FILE = "${env.DEPLOY_BASE}/env/${env.DEPLOY_BRANCH}.env"
                    env.SERVICE_NAME = "express-blog@${env.DEPLOY_BRANCH}.service"
                    env.DEPLOY_PATH = "${env.DEPLOY_BASE}/deployments/blog-${env.DEPLOY_BRANCH}"


                    if (params.oldrev?.trim() && params.newrev?.trim()) {
                        env.OLD_REV = params.oldrev
                        env.NEW_REV = params.newrev
                    } else {
                        env.OLD_REV = sh(script: 'git rev-parse HEAD~1', returnStdout: true).trim()
                        env.NEW_REV = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    }

                    echo "==== DEBUG: Revisions ===="
                    echo "params.oldrev: '${params.oldrev}'"
                    echo "params.newrev: '${params.newrev}'"
                    echo "Old revision: ${env.OLD_REV}"
                    echo "New revision: ${env.NEW_REV}"
                    sh "mkdir -p '${env.LOG_DIR}/server' '{env.LOG_DIR}/test-results'"

                }
            }
        }

        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: "*/${env.DEPLOY_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: env.GIT_REPO,
                        credentialsId: env.CREDENTIALS_ID
                    ]]
                ])
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
                    sh "git clone --branch '${env.DEPLOY_BRANCH}' '${env.GIT_REPO}' '${env.BUILD_DIR}'"
                }
            }
        }

        stage('Copy and Source .env') {
            steps {
                script {
                    sh "ln -s '${ENV_FILE}' '${env.BUILD_DIR}/.env'"

                    def envVars = sh(
                        script: "set -a && . '${env.BUILD_DIR}/.env' && env | grep -E '^(SERVER_SCHEMA|SERVER_DOMAIN)='",
                        returnStdout: true
                    ).trim().split("\n")

                    def parsedEnv = [:]
                    envVars.each {
                        def (key, value) = it.tokenize('=')
                        parsedEnv[key] = value
                    }
                    env.SERVER_SCHEMA = parsedEnv['SERVER_SCHEMA']
                    env.SERVER_DOMAIN = parsedEnv['SERVER_DOMAIN']
                }
            }
        }

        stage('Build') {
            steps {
                dir("${BUILD_DIR}") {
                    sh """
                        git submodule update --init --recursive
                        yarn
                        yarn combine:css
                    """
                }
            }
        }

        stage('Start Application for Test') {
            steps {
                script {
                    if ( !params.SKIP_TESTS ) {
                        dir(BUILD_DIR) {
                            sh """
                                sudo systemctl stop ${env.SERVICE_NAME} || true
                                nohup node src/app.js >> '${env.SERVER_LOG_FILE}' 2>&1 &
                                echo \$! > '${env.PIDFILE}'
                            """
                        }
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
                            def result = sh(script: "curl --max-time 2 --silent --fail '\${SERVER_SCHEMA}://\${SERVER_DOMAIN}/health -I' > /dev/null || true", returnStatus: true)
                            if (result == 0) {
                                success = true
                                break
                            }
                            sleep 1
                            elapsed += 1
                        }
                        if (!success) {
                            sh "cat '${env.SERVER_LOG_FILE}'"
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
                        def testStatus = sh(script: "cd '${env.BUILD_DIR}' && npm run test:postreceive", returnStatus: true)
                        archiveArtifacts artifacts: "${env.TEST_LOGS_FILE}*", onlyIfSuccessful: false
                        if (testStatus != 0) {
                            sh """
                                kill \$(cat '${env.PIDFILE}') || true
                                cat '${env.SERVER_LOG_FILE}'
                            """
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
                        sh "kill \$(cat '${env.PIDFILE}') || true"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.DEPLOY_BRANCH == 'testing') {
                        sh """
                            rm -rf '${env.DEPLOY_PATH}' || true
                            mkdir -p '${env.DEPLOY_PATH}'
                            rsync -a --delete '${env.BUILD_DIR}/' '${env.DEPLOY_PATH}/'
                        """
                    } else {
                        def dirExists = sh(script: "[ -d '${DEPLOY_PATH}' ] && echo 1 || echo 0", returnStdout: true).trim()
                        if (dirExists == "0") {
                            sh "git clone --branch '${env.DEPLOY_BRANCH}' '${env.GIT_REPO}' '${env.DEPLOY_PATH}'"
                        }
                        dir(DEPLOY_PATH) {
                            retry(2) {
                                sh "git fetch origin"
                            }
                            sh """
                                git reset --hard 'origin/${env.DEPLOY_BRANCH}'
                                git submodule update --init --recursive --force
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
                                sh """
                                    yarn set version from sources
                                    yarn
                                """
                            } else {
                                echo "No dependency changes detected. Skipping yarn install."
                            }

                            sh "yarn combine:css"
                        }
                    }
                }
            }
        }

       stage('Restart Service') {
            steps {
                script {
                    sh "sudo systemctl restart ${env.SERVICE_NAME}"
                }
            }
        }
        stage('Verify Service') {
            steps {
                script {
                    def timeout = 30
                    def elapsed = 0
                    def success = false
                    while (elapsed < timeout) {
                        def result = sh(script: "curl --max-time 2 --silent --fail '\${env.SERVER_SCHEMA}://\${env.SERVER_DOMAIN}/health -I' > /dev/null || true", returnStatus: true)
                        if (result == 0) {
                            success = true
                            break
                        }
                        sleep 1
                        elapsed += 1
                    }
                    if (!success) {
                        sh "cat '${env.SERVER_LOG_FILE}'"
                        error "Service did not become available within ${timeout}s."
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
            sh "rm -rf '${env.BUILD_DIR}' || true"
        }
    }
}
