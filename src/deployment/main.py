import sys


from deployment_pipeline.core.suite import DeploymentSuite


def main():

    runner = DeploymentSuite()
    exit_code = 0

    import traceback

    try:
        runner.run()
        print("🚀 Deployment Successful")
        exit_code = 0
    except KeyboardInterrupt:
        runner.dump_print_queue()
        traceback.print_exc()
        runner.print("\n[System] Termination signal received. Cleaning up...")
        exit_code = 0
    except Exception as e:
        runner.dump_print_queue()
        traceback.print_exc()
        print(f"❌ Deployment Failed at: {e.with_traceback(e.__traceback__)}")
        exit_code = 1
    if exit_code != 0:
        print(exit_code)
        sys.exit(exit_code or 1)
    runner.dump_print_queue()
