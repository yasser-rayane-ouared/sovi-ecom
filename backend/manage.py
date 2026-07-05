#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import socket

# Force IPv4 resolution to avoid [Errno 101] Network is unreachable on IPv6-enabled hosts like Railway
original_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    if family == socket.AF_UNSPEC:
        family = socket.AF_INET
    return original_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4_only


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
