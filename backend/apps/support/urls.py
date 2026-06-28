from django.urls import path
from .views import SupportMessageListCreateView, AdminChatListView, AdminChatDetailView

urlpatterns = [
    # Merchant endpoints
    path('messages/', SupportMessageListCreateView.as_view(), name='support-messages'),
    
    # Admin endpoints
    path('admin/chats/', AdminChatListView.as_view(), name='admin-support-chats'),
    path('admin/chats/<uuid:store_id>/', AdminChatDetailView.as_view(), name='admin-support-chat-detail'),
]
