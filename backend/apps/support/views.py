from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from apps.stores.utils import get_store_for_user
from apps.stores.models import Store
from .models import SupportMessage
from .serializers import SupportMessageSerializer
from rest_framework.exceptions import PermissionDenied

class SupportMessageListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, *args, **kwargs):
        store_id = request.query_params.get('store_id')
        if not store_id:
            return Response({'error': 'store_id query param is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        store = get_store_for_user(store_id, request.user)
        
        # Mark all messages sent by admin to this store as read by owner
        SupportMessage.objects.filter(store=store, sender_role='website_admin', is_read_by_owner=False).update(is_read_by_owner=True)
        
        messages = SupportMessage.objects.filter(store=store).order_by('created_at')
        serializer = SupportMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        store_id = request.data.get('store_id')
        if not store_id:
            return Response({'error': 'store_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        store = get_store_for_user(store_id, request.user)
        
        message_type = request.data.get('message_type', 'text')
        text = request.data.get('text', '')
        file_attachment = request.FILES.get('file_attachment')

        # Validate that if it's image or audio, there is a file
        if message_type in ['image', 'audio'] and not file_attachment:
            return Response({'error': f'file_attachment is required for {message_type} messages'}, status=status.HTTP_400_BAD_REQUEST)

        msg = SupportMessage.objects.create(
            store=store,
            sender=request.user,
            sender_role='store_owner',
            message_type=message_type,
            text=text,
            file_attachment=file_attachment,
            is_read_by_owner=True,
            is_read_by_admin=False
        )
        
        serializer = SupportMessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminChatListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not request.user.is_superadmin:
            raise PermissionDenied("Only superadmins can view support chats.")
        
        store_ids = SupportMessage.objects.values_list('store_id', flat=True).distinct()
        stores = Store.objects.filter(id__in=store_ids)
        
        chat_list = []
        for store in stores:
            latest_msg = SupportMessage.objects.filter(store=store).order_by('-created_at').first()
            if not latest_msg:
                continue
                
            unread_count = SupportMessage.objects.filter(
                store=store, 
                sender_role='store_owner', 
                is_read_by_admin=False
            ).count()
            
            chat_list.append({
                'store_id': store.id,
                'store_name': store.name,
                'store_subdomain': store.subdomain,
                'store_logo': store.logo,
                'latest_message': {
                    'text': latest_msg.text,
                    'message_type': latest_msg.message_type,
                    'created_at': latest_msg.created_at,
                    'sender_role': latest_msg.sender_role,
                },
                'unread_count': unread_count
            })
            
        chat_list.sort(key=lambda x: x['latest_message']['created_at'], reverse=True)
        return Response(chat_list)


class AdminChatDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def check_admin(self, user):
        if not user.is_superadmin:
            raise PermissionDenied("Only superadmins can access this support chat.")

    def get(self, request, store_id, *args, **kwargs):
        self.check_admin(request.user)
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
            
        SupportMessage.objects.filter(store=store, sender_role='store_owner', is_read_by_admin=False).update(is_read_by_admin=True)
        
        messages = SupportMessage.objects.filter(store=store).order_by('created_at')
        serializer = SupportMessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'store_id': store.id,
            'store_name': store.name,
            'store_subdomain': store.subdomain,
            'messages': serializer.data
        })

    def post(self, request, store_id, *args, **kwargs):
        self.check_admin(request.user)
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
            
        message_type = request.data.get('message_type', 'text')
        text = request.data.get('text', '')
        file_attachment = request.FILES.get('file_attachment')

        if message_type in ['image', 'audio'] and not file_attachment:
            return Response({'error': f'file_attachment is required for {message_type} messages'}, status=status.HTTP_400_BAD_REQUEST)

        msg = SupportMessage.objects.create(
            store=store,
            sender=request.user,
            sender_role='website_admin',
            message_type=message_type,
            text=text,
            file_attachment=file_attachment,
            is_read_by_admin=True,
            is_read_by_owner=False
        )
        
        serializer = SupportMessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
