import time
import logging
from django.db import connection
from django.conf import settings

logger = logging.getLogger(__name__)

class QueryCountMiddleware:
    """
    Middleware that logs a warning if a request triggers too many database queries.
    Useful for catching N+1 queries during local development.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # connection.queries is only populated when settings.DEBUG is True
        if not settings.DEBUG:
            return self.get_response(request)

        start_queries = len(connection.queries)
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time
        num_queries = len(connection.queries) - start_queries

        if num_queries > 20:
            logger.warning(
                f"\n⚠️ WARNING: Potential N+1 query loop or heavy DB load detected!\n"
                f"Path: {request.method} {request.path}\n"
                f"Queries: {num_queries} executed in {duration:.4f}s\n"
            )

        return response
