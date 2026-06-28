from rest_framework import serializers
from .models import SupportMessage
from apps.accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar']

class SupportMessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    file_attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = [
            'id', 'store', 'sender', 'sender_role', 'message_type',
            'text', 'file_attachment', 'file_attachment_url',
            'is_read_by_admin', 'is_read_by_owner', 'created_at',
            'sender_details'
        ]
        read_only_fields = ['id', 'created_at', 'sender', 'sender_role', 'is_read_by_admin', 'is_read_by_owner']

    def get_file_attachment_url(self, obj):
        if obj.file_attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_attachment.url)
            return obj.file_attachment.url
        return None
