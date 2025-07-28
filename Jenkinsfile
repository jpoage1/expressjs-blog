pipeline {
    agent any

    environment {
        GIT_REPO = 'ssh://git@git.jasonpoage.com:29418/jason/express-blog.git'
        DEPLOY_BASE = '/srv/jasonpoage.com'
        LOG_DIR = "${DEPLOY_BASE}/deployments/logs"
        TIMESTAMP = sh(script: "date +%Y%m%d-%H%M%S", returnStdout: true).trim()
    }

    options {
        timestamps()
    }


    parameters {
        string(name: 'branch', defaultValue: 'refs/heads/testing', description: 'Branch ref from webhook')
        string(name: 'before', defaultValue: '', description: 'old ref')
        string(name: 'after', defaultValue: '', description: 'new ref')
    }

    stages {
        stage('Init Branch') {
            steps {
                script {
                    echo "==== DEBUG: Branch Param ===="
                    echo "params.branch: '${params.branch}'"
                    echo "params.before: '${params.before}'"
                    echo "params.after: '${params.after}'"
                    if (params.branch?.startsWith("refs/heads/")) {
                        env.DEPLOY_BRANCH = params.branch.replaceFirst(/^refs\/heads\//, '')
                    } else {
                        error "Invalid branch ref: '${params.branch}'"
                    }
                }

                script {
                    echo "==== DEBUG: Branch Param ===="
                    echo "params.branch: '${params.branch}'"
                    echo "params.before: '${params.before}'"
                    echo "params.after: '${params.after}'"

                    def resolvedBranch = params.branch?.trim()
                    echo "Resolved branch: '${resolvedBranch}'"

                    if (resolvedBranch?.startsWith("refs/heads/")) {
                        def deployBranch = resolvedBranch.replaceFirst(/^refs\/heads\//, '')
                        echo "Deploy branch (stripped): '${deployBranch}'"
                    } else {
                        echo "Branch is not a valid refs/heads/* ref: '${resolvedBranch}'"
                    }
                }
            }
        }
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: "${env.DEPLOY_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: env.GIT_REPO,
                        credentialsId: '08a57452-477d-4aa6-86c6-242553660b3f'
                    ]]
                ])
                script {
                    if (params.before?.trim() && params.after?.trim()) {
                        env.OLD_REV = params.before
                        env.NEW_REV = params.after
                    } else {
                        env.OLD_REV = sh(script: 'git rev-parse HEAD~1', returnStdout: true).trim()
                        env.NEW_REV = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    }
                }

            }
        }


        stage('Use Revs') {
            steps {
                echo "Old revision: ${env.OLD_REV}"
                echo "New revision: ${env.NEW_REV}"
                // further steps
            }
        }

        stage('Validate Branch') {
            steps {
                script {
                    def allowed = ['testing', 'staging', 'main', 'production']
                    if (!allowed.contains(params.DEPLOY_BRANCH)) {
                        error "Branch '${params.DEPLOY_BRANCH}' is not allowed for deployment."
                    }
                }
            }
        }

        stage('Clone to Tempdir') {
            steps {
                script {
                    env.TMPDIR = sh(script: "mktemp -d", returnStdout: true).trim()
                    sh """
                        git clone --branch '${params.DEPLOY_BRANCH}' '${GIT_REPO}' '${TMPDIR}'
                    """
                }
            }
        }

        stage('Copy and Source .env') {
            steps {
                script {
                    env.ENV_FILE = "${DEPLOY_BASE}/env/${params.DEPLOY_BRANCH}.env"
                    env.LOG_FILE = "${LOG_DIR}/receive-${env.TIMESTAMP}.log"

                    sh """
                        ln -s '${ENV_FILE}' '${TMPDIR}/.env'
                    """

                    def envVars = sh(
                        script: "set -a && . '${TMPDIR}/.env' && env | grep -E '^(SERVER_SCHEMA|SERVER_DOMAIN)='",
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
                    cd '${TMPDIR}'
                    git submodule update --init --recursive
                """
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    def skipInstall = false
                    if (env.OLD_REV && env.NEW_REV && env.OLD_REV != "0000000000000000000000000000000000000000") {
                        def changed = sh(
                            script: "git --git-dir='${TMPDIR}/.git' diff-tree --name-only -r ${env.OLD_REV}..${env.NEW_REV}",
                            returnStdout: true
                        )
                        if (!changed.contains('package.json') && !changed.contains('yarn.lock')) {
                            skipInstall = true
                        }

                        skipInstall = false
                    }

                    if (!skipInstall) {
                        sh """
                            cd '${TMPDIR}'
                            yarn --cache-folder /var/cache/jenkins/yarn
                        """
                    } else {
                        echo "No dependency changes detected. Skipping yarn install."
                    }
                }
            }
        }

        stage('Build CSS') {
            steps {
                sh """
                    cd '${TMPDIR}'
                    yarn --production=false combine:css
                """
            }
        }

        stage('Start Application for Test') {
            steps {
                script {
                    if ( !params.SKIP_TESTS ) {
                        env.PIDFILE = "${TMPDIR}/test.pid"
                        sh """
                            sudo systemctl stop express-blog@${params.DEPLOY_BRANCH}.service || true
                            cd '${TMPDIR}'
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
                        def testStatus = sh(script: "cd '${TMPDIR}' && npm run test:postreceive", returnStatus: true)
                        if (testStatus != 0) {
                            sh "kill \$(cat '${PIDFILE}') || true"
                            sh "cat '${LOG_FILE}'"
                            error "Tests failed for branch ${params.DEPLOY_BRANCH}"
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
                    def DEPLOY_PATH = "${DEPLOY_BASE}/deployments/blog-${params.DEPLOY_BRANCH}"
                    if (params.DEPLOY_BRANCH == 'testing') {
                        sh """
                            rm -rf '${DEPLOY_PATH}' || true
                            mv '${TMPDIR}' '${DEPLOY_PATH}'
                            ln -sf '${ENV_FILE}' '${DEPLOY_PATH}/.env'
                        """
                    } else {
                        def dirExists = sh(script: "[ -d '${DEPLOY_PATH}' ] && echo 1 || echo 0", returnStdout: true).trim()
                        if (dirExists == "0") {
                            sh "git clone --branch '${params.DEPLOY_BRANCH}' '${GIT_REPO}' '${DEPLOY_PATH}'"
                        }

                        sh """
                            cd '${DEPLOY_PATH}'
                            git fetch origin
                            git reset --hard 'origin/${params.DEPLOY_BRANCH}'
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
                            sh "cd '${DEPLOY_PATH}' && yarn --cache-folder /var/cache/jenkins/yarn"
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
                sh "sudo systemctl restart express-blog@${env.DEPLOY_BRANCH}.service"
            }
        }

    }

    post {
        success {
            echo "Deployment of ${params.DEPLOY_BRANCH} completed successfully."
        }
        failure {
            echo "Deployment of ${params.DEPLOY_BRANCH} failed."
        }
        cleanup {
            sh "rm -rf '${TMPDIR}' || true"
        }
    }
}
