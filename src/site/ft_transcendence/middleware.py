from django.db import DatabaseError, OperationalError
from django.http import JsonResponse

class RequestExceptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        except (DatabaseError, OperationalError):
            return JsonResponse({"server_error": "Database is offline"}, status=503)
        except Exception as e:
            return JsonResponse({"server_error": f"exception {e}"}, status=503)
        return response

    def process_exception(self, request, exception):
        if isinstance(exception, (DatabaseError, OperationalError)):
            return JsonResponse({"server_error": "Database is offline"}, status=503)
        else:
            return JsonResponse({"server_error": f"exception {exception}"}, status=503)
