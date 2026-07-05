"""
WSGI config for S Platform.
"""
import os
import socket

# Force IPv4 resolution to avoid [Errno 101] Network is unreachable on IPv6-enabled hosts like Railway
original_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    if family == socket.AF_UNSPEC:
        family = socket.AF_INET
    return original_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4_only

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
application = get_wsgi_application()
