import json
from django.conf import settings
from django.db import models

class SQLiteSafeJSONField(models.TextField):
    """
    A simple JSON field subclassing TextField to avoid SQLite's JSONField checks/compatibility issues.
    """
    def __init__(self, *args, **kwargs):
        kwargs.pop('encoder', None)
        kwargs.pop('decoder', None)
        super().__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            return value

    def to_python(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return value
        return value

    def get_prep_value(self, value):
        if value is None:
            return value
        return json.dumps(value)

    def value_to_string(self, obj):
        value = self.value_from_object(obj)
        return self.get_prep_value(value)

db_engine = settings.DATABASES.get('default', {}).get('ENGINE', '')
if 'sqlite3' in db_engine:
    JSONField = SQLiteSafeJSONField
else:
    JSONField = models.JSONField
