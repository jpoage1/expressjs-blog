import sys
import traceback


class SuiteError(Exception):
    def __init__(
        self, parent, *args, critical: bool = False, code: int | None = None, **kwargs
    ):
        super().__init__(*args, **kwargs)
        parent.dump_print_queue()
        traceback.print_stack()
        print(*args, **kwargs)

        if code is not None:
            sys.exit(code)
        if critical:
            raise RuntimeError(*args, **kwargs)
        sys.exit(1)


class TaskError(SuiteError):
    def __init__(
        self, parent, *args, critical: bool = False, code: int | None = None, **kwargs
    ):
        super().__init__(parent, *args, critical=critical, code=code, **kwargs)
        # I dont think this code is reachable
        if critical:
            raise RuntimeError(*args, **kwargs)
        else:
            print(*args, **kwargs)
            traceback.print_stack()
