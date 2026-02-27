GIT_REPO = 'ssh://git@git.jasonpoage.vpn:29418/jason/express-blog.git'
DEPLOY_BASE = '/srv/jasonpoage.com'
YARN_ENABLE_GLOBAL_CACHE = 'false'
YARN_CACHE_FOLDER = '/var/cache/jenkins/yarn'
CREDENTIALS_ID = '08a57452-477d-4aa6-86c6-242553660b3f'



options {
    timestamps()
}


parameters {
    string(name: 'branch', defaultValue: 'refs/heads/main', description: 'Branch ref from webhook')
    string(name: 'oldrev', defaultValue: '', description: 'old rev')
    string(name: 'newrev', defaultValue: '', description: 'new rev')

    booleanParam(name: 'SKIP_TESTS', defaultValue: true, description: 'Skip all testing')
}
class test_runner:
    def init():
        print('Init')
        if params.branch?.startsWith("refs/heads/"):
            DEPLOY_BRANCH = params.branch.replaceFirst(/^refs\/heads\//, '')
            else:
            print(f "Invalid branch ref: '{params.branch}'")


        print( "==== DEBUG: Branch Param ====")
        print ("params.branch: '{params.branch}'")
        print ("DEPLOY_BRANCH: '{DEPLOY_BRANCH}'")

        TIMESTAMP = sh(script: "date +%Y%m%d-%H%M%S", returnStdout: true).trim()
        LOG_DIR = f"{DEPLOY_BASE}/deployments/logs"
        SERVER_LOG_FILE = f"{LOG_DIR}/server/server-{TIMESTAMP}.log"
        TEST_LOGS_FILE = f"{LOG_DIR}/test-results/test-"
        BUILD_DIR = f"{WORKSPACE}/build"
        PIDFILE = f"{BUILD_DIR}/test.pid"
        ENV_FILE = f"{DEPLOY_BASE}/env/{DEPLOY_BRANCH}.env"
        SERVICE_NAME = f"express-blog@{DEPLOY_BRANCH}.service"
        DEPLOY_PATH = f"{DEPLOY_BASE}/deployments/blog-{DEPLOY_BRANCH}"


        if params.oldrev?.trim() && params.newrev?.trim():
            OLD_REV = params.oldrev
            NEW_REV = params.newrev
        else :
            OLD_REV = sh(script: 'git rev-parse HEAD~1', returnStdout: true).trim()
            NEW_REV = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()

        print (f"==== DEBUG: Revisions ====")
        print (f"params.oldrev: '{params.oldrev}'")
        print (f"params.newrev: '{params.newrev}'")
        print (f"Old revision: {OLD_REV}")
        print (f"New revision: {NEW_REV}")
        sh (f"mkdir -p '{LOG_DIR}/server' '{LOG_DIR}/test-results'")
    def checkout () :
        print('Checkout')
        checkout([$class: 'GitSCM',
            branches: [[name: "*/{DEPLOY_BRANCH}"]],
            userRemoteConfigs: [[
                url: GIT_REPO,
                credentialsId: CREDENTIALS_ID
            ]]
        ])

    def validate_branch():
        print('Validate Branch')
        steps {
            script {
                def allowed = ['testing', 'staging', 'main', 'production']
                if (!allowed.contains(DEPLOY_BRANCH)) {
                    fail "Branch '{DEPLOY_BRANCH}' is not allowed for deployment."
                }
            }
        }

    def clone_build_dir():
        print('Clone to Build Dir')
        sh (f"git clone --branch '{DEPLOY_BRANCH}' '{GIT_REPO}' '{BUILD_DIR}'")

    def build():
        print('Build')
        dir(f"{BUILD_DIR}") {
            sh """
                git submodule update --init --recursive
                yarn
                yarn combine:css
            """

    def start_app():
        print('Start Application for Test') {
        if not params.SKIP_TESTS :
            dir(BUILD_DIR) {
                sh """
                    sudo systemctl stop {SERVICE_NAME} || true
                    corepack enable
                    nohup yarn run prod >> '{SERVER_LOG_FILE}' 2>&1 &
                    echo \$! > '{PIDFILE}'
                """

    def wait_for_service():
        print('Wait for Service Readiness')
        if not params.SKIP_TESTS  :
            def timeout = 30
            def elapsed = 0
            def success = false
            while elapsed < timeout :
                def result = sh(script: f"curl --max-time 2 --silent --fail '\{SERVER_SCHEMA}://\{SERVER_DOMAIN}/health -I' > /dev/null || true", returnStatus: true)
                if result == 0:
                    success = true
                    break
                sleep 1
                elapsed += 1
                if not success :
                sh f"cat '{SERVER_LOG_FILE}'"
                fail f"Service did not become available within {timeout}s."
            }
        }
    }

    def run_tests():
            print('Run Tests')
            if not params.SKIP_TESTS :
                def testStatus = sh(script: f"cd '{BUILD_DIR}' && npm run test:postreceive", returnStatus: true)
                archiveArtifacts artifacts: f"{TEST_LOGS_FILE}*", onlyIfSuccessful: false
                if testStatus != 0:
                    sh f"""
                        kill \$(cat '{PIDFILE}') || true
                        cat '{SERVER_LOG_FILE}'
                    """
                    fail( "Tests failed for branch {DEPLOY_BRANCH}")
                }
            }

    def kill_test_server():
        """systemctl stop test server"""
        print('Stop Test App')
        if not params.SKIP_TESTS :
            sh ("kill \$(cat '{PIDFILE}') || true")
    def deploy():
        print('Deploy')
        # 1. Create the new release directory
        releaseDir = f"{DEPLOY_BASE}/releases/blog-{DEPLOY_BRANCH}-{TIMESTAMP}"
        sh( f"mkdir -p {releaseDir}")

        # 2. Sync the finished build to the release directory
        print(f"Deploying build to {releaseDir}")
        sh( f"rsync -a --delete '{BUILD_DIR}/' '{releaseDir}/'")

        # 3. Atomically flip the symlink
        # We use 'ln -sfn' to overwrite the existing link to the new path
        sh (f"ln -sfn '{releaseDir}' '{DEPLOY_PATH}'")

        # 4. Cleanup old releases (Keep only last 5)
        dir(f"{DEPLOY_BASE}/releases") {
            sh f"ls -1t | grep 'blog-{DEPLOY_BRANCH}' | tail -n +6 | xargs rm -rf || true"
            }
    def restart_production_server():
       print('Restart Service')
        sh f"sudo systemctl restart {SERVICE_NAME}"
    def verify_service():
        print("VerifyService")
        timeout = 30
        elapsed = 0
        success = false
        while (elapsed < timeout):
            result = sh(script: f"curl --max-time 2 --silent --fail '{SERVER_SCHEMA}://{SERVER_DOMAIN}/health -I' > /dev/null || true", returnStatus: true)
            if result == 0:
                success = true
                break
            sleep 1
            elapsed += 1
        if not success:
                print(SERVER_LOG_FILE)
                self.fail( f"Service did not become available within {timeout}s.")
