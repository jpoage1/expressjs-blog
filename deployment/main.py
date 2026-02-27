import sys


from core.suite import DeploymentSuite


def main():

    runner = DeploymentSuite()
    exit_code = 0

    try:
        runner.run()
        print("🚀 Deployment Successful")
        exit_code = 0
    except KeyboardInterrupt:
        runner.print("\n[System] Termination signal received. Cleaning up...")
        runner.dump_print_queue()
        exit_code = 0
    except Exception as e:
        print(f"❌ Deployment Failed at: {e.with_traceback(e.__traceback__)}")
        exit_code = 1
    runner.dump_print_queue()
    if exit_code != 0:
        print(exit_code)
        sys.exit(exit_code or 1)
