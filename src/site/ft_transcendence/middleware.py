from django.db import connection
from django.http import JsonResponse

class CheckDBConnectionMiddleware:
    """Middleware to check database connection before processing any request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            connection.ensure_connection()
        except Exception as e:
            return JsonResponse({"error": "Database Connection Failed", "details": str(e)}, status=503)

        return self.get_response(request)
