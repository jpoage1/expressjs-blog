import sys


from core.suite import DeploymentSuite


def main():

    runner = DeploymentSuite()
    exit_code = None

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
        raise
        exit_code = 1
    runner.dump_print_queue()
    sys.exit(exit_code or 1)
