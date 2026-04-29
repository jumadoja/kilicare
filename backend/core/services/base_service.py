class BaseService:
    """
    Base Service Layer for all business logic
    Every service in apps will inherit this
    """

    def execute(self, *args, **kwargs):
        raise NotImplementedError("Service must implement execute() method")