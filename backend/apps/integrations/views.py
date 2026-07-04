"""Integrations views."""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.stores.models import Store
from apps.stores.utils import get_store_for_user
from .models import GoogleSheetsConfig
from .serializers import GoogleSheetsConfigSerializer

class GoogleSheetsConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = GoogleSheetsConfigSerializer

    def get_object(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'integrations')
        config, _ = GoogleSheetsConfig.objects.get_or_create(store=store)
        return config


class TestSheetsConnectionView(APIView):
    def post(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'integrations')
        config = GoogleSheetsConfig.objects.filter(store=store).first()

        if not config or not config.credentials_json or not config.spreadsheet_id:
            return Response({'error': 'Configurations are missing'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import json
            import gspread
            from google.oauth2.service_account import Credentials

            scopes = ['https://www.googleapis.com/auth/spreadsheets']
            creds_dict = json.loads(config.credentials_json)
            creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
            client = gspread.authorize(creds)
            sh = client.open_by_key(config.spreadsheet_id)
            return Response({'message': f'Connected successfully to Google Spreadsheet: "{sh.title}"!'})
        except Exception as e:
            return Response({'error': f'Connection failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


import re
import time
import json
import requests
import uuid
import queue
import logging
from django.db import transaction
from django.http import StreamingHttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from apps.products.models import Product
from apps.orders.models import Order
from .models import ClaudeConfig
from .serializers import ClaudeConfigSerializer

logger = logging.getLogger(__name__)

# Thread-safe session manager that uses Redis if available, else falls back to process-local memory
class McpSessionManager:
    def __init__(self):
        try:
            from django_redis import get_redis_connection
            self.redis_conn = get_redis_connection("default")
            self.redis_conn.ping()
        except Exception:
            self.redis_conn = None
            logger.info("Redis not available for MCP sessions, falling back to local memory.")
        self.local_sessions = {}

    def create_session(self, session_id):
        if self.redis_conn:
            self.redis_conn.sadd("mcp:active_sessions", session_id)
        else:
            self.local_sessions[session_id] = queue.Queue()

    def delete_session(self, session_id):
        if self.redis_conn:
            self.redis_conn.srem("mcp:active_sessions", session_id)
            self.redis_conn.delete(f"mcp:session:{session_id}")
        else:
            if session_id in self.local_sessions:
                del self.local_sessions[session_id]

    def is_active(self, session_id):
        if self.redis_conn:
            return self.redis_conn.sismember("mcp:active_sessions", session_id)
        else:
            return session_id in self.local_sessions

    def put_message(self, session_id, message):
        if self.redis_conn:
            key = f"mcp:session:{session_id}"
            self.redis_conn.rpush(key, json.dumps(message))
            self.redis_conn.expire(key, 120)
        else:
            if session_id in self.local_sessions:
                self.local_sessions[session_id].put(message)

    def get_message(self, session_id, timeout=2):
        if self.redis_conn:
            key = f"mcp:session:{session_id}"
            start_time = time.time()
            while time.time() - start_time < timeout:
                try:
                    res = self.redis_conn.lpop(key)
                    if res:
                        if isinstance(res, bytes):
                            res = res.decode('utf-8')
                        return json.loads(res)
                except Exception as e:
                    logger.error(f"Error reading from Redis: {e}")
                    break
                time.sleep(0.2)
            return None
        else:
            if session_id in self.local_sessions:
                try:
                    return self.local_sessions[session_id].get(timeout=timeout)
                except queue.Empty:
                    return None
            return None

session_manager = McpSessionManager()

class ClaudeConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = ClaudeConfigSerializer

    def get_object(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'integrations')
        config, _ = ClaudeConfig.objects.get_or_create(store=store)
        return config


from .models import TelegramConfig
from .serializers import TelegramConfigSerializer

class TelegramConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = TelegramConfigSerializer

    def get_object(self):
        store = get_store_for_user(self.kwargs['store_id'], self.request.user, 'integrations')
        config, _ = TelegramConfig.objects.get_or_create(store=store)
        return config


class TestTelegramConnectionView(APIView):
    def post(self, request, store_id):
        from django.conf import settings
        store = get_store_for_user(store_id, request.user, 'integrations')
        config = TelegramConfig.objects.filter(store=store).first()

        bot_token = settings.TELEGRAM_BOT_TOKEN
        if not bot_token:
            return Response({'error': 'Platform Telegram Bot Token is not configured on settings.'}, status=status.HTTP_400_BAD_REQUEST)

        if not config or not config.chat_id:
            return Response({'error': 'Telegram configuration chat ID is missing.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import requests
            test_msg = f"🔌 <b>Sovi Integration Test</b>\n\nConnection successful! Your store <b>{store.name}</b> is now connected to Telegram notifications."
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                'chat_id': config.chat_id,
                'text': test_msg,
                'parse_mode': 'HTML'
            }
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                return Response({'message': 'Test message sent successfully to Telegram!'})
            else:
                return Response({'error': f'Failed to send message: {resp.text}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Connection failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)




class ClaudeChatView(APIView):
    def post(self, request, store_id):
        store = get_store_for_user(store_id, request.user, 'integrations')
        config, _ = ClaudeConfig.objects.get_or_create(store=store)
        
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message required'}, status=400)

        # Context gathering
        products = Product.objects.filter(store=store, status='active')
        products_list = []
        for p in products:
            products_list.append({
                'id': str(p.id),
                'title': p.title,
                'price': float(p.price),
                'cost_price': float(p.cost_price or 0.0),
                'description': p.description[:100]
            })

        orders = Order.objects.filter(store=store, is_abandoned=False).order_by('-created_at')[:10]
        orders_list = []
        for o in orders:
            orders_list.append({
                'order_number': o.order_number,
                'total': float(o.total),
                'status': o.status,
                'customer_name': o.full_name,
                'created_at': o.created_at.strftime('%Y-%m-%d')
            })

        store_info = {
            'name': store.name,
            'subdomain': store.subdomain,
            'products': products_list,
            'recent_orders': orders_list
        }

        api_key = config.api_key.strip() if config.api_key else ""
        
        system_prompt = (
            f"You are Claude, a helpful AI assistant integrated into Sovi - a SaaS Algerian COD E-Commerce Platform.\n"
            f"Here is the context of the user's store:\n"
            f"{json.dumps(store_info, indent=2)}\n\n"
            f"Allowed actions: You can ask the system to perform updates. "
            f"If the user asks you to do a task such as updating a product's price or description, you must respond with a JSON block at the very end of your response inside a markdown block:\n"
            f"```json\n"
            f"{{\n"
            f"  \"action\": \"update_price\",\n"
            f"  \"product_id\": \"<product_id>\",\n"
            f"  \"new_price\": <number>\n"
            f"}}\n"
            f"```\n"
            f"or for description:\n"
            f"```json\n"
            f"{{\n"
            f"  \"action\": \"update_description\",\n"
            f"  \"product_id\": \"<product_id>\",\n"
            f"  \"new_description\": \"<text>\"\n"
            f"}}\n"
            f"```\n"
            f"Be precise. Answer questions clearly. Speak in the user's preferred language (e.g. Arabic, French, or English)."
        )

        response_text = ""
        action_executed = None

        if api_key and config.is_active:
            try:
                headers = {
                    'x-api-key': api_key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
                payload = {
                    'model': 'claude-3-5-sonnet-20241022',
                    'max_tokens': 1024,
                    'system': system_prompt,
                    'messages': [
                        {'role': 'user', 'content': user_message}
                    ]
                }
                api_res = requests.post('https://api.anthropic.com/v1/messages', json=payload, headers=headers, timeout=15)
                if api_res.status_code == 200:
                    response_text = api_res.json()['content'][0]['text']
                else:
                    response_text = f"Error from Anthropic API (Status: {api_res.status_code}): {api_res.text}"
            except Exception as e:
                response_text = f"Failed to connect to Anthropic API: {str(e)}. Falling back to local helper mode."

        if not response_text:
            msg_lower = user_message.lower()
            if "product" in msg_lower or "سلع" in msg_lower or "منتج" in msg_lower:
                plist = "\n".join([f"- {p['title']} (ID: {p['id'][:8]}) - Price: {p['price']} DZD" for p in products_list])
                response_text = f"Here are your active products:\n{plist or 'No products found.'}"
            elif "order" in msg_lower or "طلب" in msg_lower or "بيع" in msg_lower:
                olist = "\n".join([f"- Order #{o['order_number']} by {o['customer_name']} - {o['total']} DZD [{o['status']}]" for o in orders_list])
                response_text = f"Here are your recent orders:\n{olist or 'No orders found.'}"
            elif ("update" in msg_lower or "تعديل" in msg_lower or "غير" in msg_lower) and ("price" in msg_lower or "سعر" in msg_lower):
                matched_p = None
                new_price = None
                for p in products_list:
                    if p['title'].lower() in msg_lower:
                        matched_p = p
                        break
                
                nums = re.findall(r'\d+', msg_lower)
                if nums:
                    new_price = float(nums[0])
                
                if matched_p and new_price:
                    response_text = (
                        f"I will update the price of **{matched_p['title']}** to {new_price} DZD.\n\n"
                        f"```json\n"
                        f"{{\n"
                        f"  \"action\": \"update_price\",\n"
                        f"  \"product_id\": \"{matched_p['id']}\",\n"
                        f"  \"new_price\": {new_price}\n"
                        f"}}\n"
                        f"```"
                    )
                else:
                    response_text = (
                        "If you want me to update a product price, please specify the product title and new price. For example: 'Update the price of watch to 5000 DZD'."
                    )
            else:
                response_text = (
                    f"Hello! I am your Claude Store Assistant [Simulated Mode].\n\n"
                    f"To activate the real Claude-3.5-Sonnet integration, please configure your Anthropic API Key in Settings > Integrations.\n\n"
                    f"In this preview mode, I can analyze your store data. For example, you can ask me to list your products or check your recent orders!"
                )

        # Parse actions from response_text and execute them in database
        try:
            action_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if action_match:
                action_data = json.loads(action_match.group(1))
                action = action_data.get('action')
                product_id = action_data.get('product_id')
                
                if action == 'update_price' and product_id:
                    new_price = action_data.get('new_price')
                    with transaction.atomic():
                        prod = Product.objects.get(id=product_id, store=store)
                        old_price = prod.price
                        prod.price = new_price
                        prod.save()
                        action_executed = f"Updated price of '{prod.title}' from {old_price} DZD to {new_price} DZD."
                elif action == 'update_description' and product_id:
                    new_desc = action_data.get('new_description')
                    with transaction.atomic():
                        prod = Product.objects.get(id=product_id, store=store)
                        prod.description = new_desc
                        prod.save()
                        action_executed = f"Updated description of '{prod.title}'."
        except Exception as e:
            action_executed = f"Failed to execute task: {str(e)}"

        return Response({
            'response': response_text,
            'action_executed': action_executed
        })


@method_decorator(csrf_exempt, name='dispatch')
class McpSseView(View):
    """
    GET endpoint to establish the Server-Sent Events stream with Claude.
    """

    def get(self, request, store_id, token=None):
        if not token:
            token = request.GET.get('token')
        if not token:
            return JsonResponse({'error': 'Authentication token is required.'}, status=401)
        
        try:
            config = get_object_or_404(ClaudeConfig, store_id=store_id, id=token)
            if not config.is_active:
                return JsonResponse({'error': 'Claude integration is disabled for this store.'}, status=403)
        except Exception:
            return JsonResponse({'error': 'Invalid token or store configuration.'}, status=401)

        session_id = str(uuid.uuid4())
        session_manager.create_session(session_id)

        def event_stream():
            token_in_path = request.resolver_match.url_name == 'mcp-sse-token' or 'token' in request.resolver_match.kwargs
            if token_in_path:
                post_path = reverse('mcp-message-token', kwargs={'store_id': store_id, 'token': token})
                post_url = request.build_absolute_uri(post_path)
            else:
                post_path = reverse('mcp-message', kwargs={'store_id': store_id})
                post_url = request.build_absolute_uri(post_path) + f"?token={token}"
                
            post_url += f"{'&' if '?' in post_url else '?'}session_id={session_id}"
            
            yield f"event: endpoint\ndata: {post_url}\n\n"
            
            try:
                while True:
                    msg = session_manager.get_message(session_id, timeout=2)
                    if msg:
                        yield f"event: message\ndata: {json.dumps(msg)}\n\n"
                    else:
                        yield ": ping\n\n"
            except GeneratorExit:
                logger.info(f"SSE client disconnected for session {session_id}")
            finally:
                session_manager.delete_session(session_id)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    def post(self, request, store_id, token=None):
        if not token:
            token = request.GET.get('token')
        if not token:
            return JsonResponse({'error': 'Authentication token is required.'}, status=401)
        
        try:
            config = get_object_or_404(ClaudeConfig, store_id=store_id, id=token)
            if not config.is_active:
                return JsonResponse({'error': 'Claude integration is disabled for this store.'}, status=403)
        except Exception:
            return JsonResponse({'error': 'Invalid token or store configuration.'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
            method = data.get('method')
            request_id = data.get('id')
            params = data.get('params', {})
        except Exception as e:
            return JsonResponse({'error': f'Invalid JSON payload: {str(e)}'}, status=400)

        response_payload = process_mcp_message(store_id, method, params, request_id)
        return JsonResponse(response_payload)


def process_mcp_message(store_id, method, params, request_id):
    result = None
    error = None
    
    try:
        if method == 'initialize':
            result = {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "resources": {}
                },
                "serverInfo": {
                    "name": "Sovi-Store-MCP-Server",
                    "version": "1.0"
                }
            }
        elif method == 'notifications/initialized':
            pass
        
        elif method == 'tools/list':
            result = {
                "tools": [
                    {
                        "name": "update_product_price",
                        "description": "Updates the price of a specific product in the store.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "product_id": {
                                    "type": "string",
                                    "description": "The exact UUID of the product to update."
                                },
                                "new_price": {
                                    "type": "number",
                                    "description": "The new price for the product in DZD (Algerian Dinar)."
                                }
                            },
                            "required": ["product_id", "new_price"]
                        }
                    },
                    {
                        "name": "update_product_description",
                        "description": "Updates the description of a specific product in the store.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "product_id": {
                                    "type": "string",
                                    "description": "The exact UUID of the product to update."
                                },
                                "new_description": {
                                    "type": "string",
                                    "description": "The new description text for the product."
                                }
                            },
                            "required": ["product_id", "new_description"]
                        }
                    }
                ]
            }
        
        elif method == 'tools/call':
            tool_name = params.get('name')
            arguments = params.get('arguments', {})
            
            from apps.stores.models import Store
            store = Store.objects.get(id=store_id)
            
            if tool_name == 'update_product_price':
                product_id = arguments.get('product_id')
                new_price = arguments.get('new_price')
                
                prod = Product.objects.get(id=product_id, store=store)
                old_price = prod.price
                prod.price = new_price
                prod.save()
                
                result = {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Successfully updated the price of '{prod.title}' (ID: {product_id}) from {old_price} DZD to {new_price} DZD."
                        }
                    ],
                    "isError": False
                }
            
            elif tool_name == 'update_product_description':
                product_id = arguments.get('product_id')
                new_description = arguments.get('new_description')
                
                prod = Product.objects.get(id=product_id, store=store)
                prod.description = new_description
                prod.save()
                
                result = {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Successfully updated the description of '{prod.title}' (ID: {product_id})."
                        }
                    ],
                    "isError": False
                }
            else:
                error = {
                    "code": -32601,
                    "message": f"Method not found: tool '{tool_name}' is not supported."
                }
        
        elif method == 'resources/list':
            result = {
                "resources": [
                    {
                        "uri": "s-platform://products",
                        "name": "Store Products",
                        "description": "A list of all active products in the store, including their IDs, titles, prices, and descriptions.",
                        "mimeType": "application/json"
                    },
                    {
                        "uri": "s-platform://orders/recent",
                        "name": "Recent Orders",
                        "description": "A list of the 10 most recent orders in the store, including customer names, order numbers, totals, and statuses.",
                        "mimeType": "application/json"
                    },
                    {
                        "uri": "s-platform://analytics/kpis",
                        "name": "Store KPIs and Analytics",
                        "description": "Key business metrics for the store: total sales, total orders, average order value (AOV).",
                        "mimeType": "application/json"
                    }
                ]
            }
        
        elif method == 'resources/read':
            uri = params.get('uri')
            from apps.stores.models import Store
            store = Store.objects.get(id=store_id)
            
            if uri == 's-platform://products':
                products = Product.objects.filter(store=store, status='active')
                products_list = []
                for p in products:
                    products_list.append({
                        'id': str(p.id),
                        'title': p.title,
                        'price': float(p.price),
                        'cost_price': float(p.cost_price or 0.0),
                        'description': p.description
                    })
                
                result = {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(products_list, ensure_ascii=False)
                        }
                    ]
                }
            
            elif uri == 's-platform://orders/recent':
                orders = Order.objects.filter(store=store, is_abandoned=False).order_by('-created_at')[:10]
                orders_list = []
                for o in orders:
                    orders_list.append({
                        'order_number': o.order_number,
                        'total': float(o.total),
                        'status': o.status,
                        'customer_name': o.full_name,
                        'created_at': o.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                result = {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(orders_list, ensure_ascii=False)
                        }
                    ]
                }
            
            elif uri == 's-platform://analytics/kpis':
                from django.db.models import Sum
                confirmed_orders = Order.objects.filter(store=store, is_abandoned=False, status='delivered')
                total_sales = float(confirmed_orders.aggregate(Sum('total'))['total__sum'] or 0.0)
                total_orders = Order.objects.filter(store=store, is_abandoned=False).count()
                aov = total_sales / total_orders if total_orders > 0 else 0.0
                
                kpis = {
                    'total_sales_dzd': total_sales,
                    'total_orders_count': total_orders,
                    'average_order_value_dzd': aov
                }
                
                result = {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(kpis, ensure_ascii=False)
                        }
                    ]
                }
            else:
                error = {
                    "code": -32602,
                    "message": f"Resource not found: URI '{uri}' is not supported."
                }
        
        else:
            error = {
                "code": -32601,
                "message": f"Method not found: '{method}'"
            }

    except Exception as e:
        error = {
            "code": -32603,
            "message": f"Internal error: {str(e)}"
        }

    response_payload = {
        "jsonrpc": "2.0"
    }
    if request_id is not None:
        response_payload["id"] = request_id
    
    if error:
        response_payload["error"] = error
    else:
        response_payload["result"] = result
        
    return response_payload


@method_decorator(csrf_exempt, name='dispatch')
class McpMessageView(APIView):
    """
    POST endpoint to receive JSON-RPC 2.0 messages from Claude client.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request, store_id, token=None):
        if not token:
            token = request.GET.get('token')
        session_id = request.GET.get('session_id')
        
        if not token or not session_id:
            return Response({'error': 'Missing authentication parameters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            config = get_object_or_404(ClaudeConfig, store_id=store_id, id=token)
            if not config.is_active:
                return Response({'error': 'Claude integration is disabled for this store.'}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({'error': 'Invalid authentication token.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            data = request.data
            method = data.get('method')
            request_id = data.get('id')
            params = data.get('params', {})
        except Exception as e:
            return Response({'error': f'Invalid JSON payload: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        response_payload = process_mcp_message(store_id, method, params, request_id)

        if session_manager.is_active(session_id):
            session_manager.put_message(session_id, response_payload)
            return Response(status=status.HTTP_200_OK)
        else:
            logger.warning(f"Session {session_id} not found in active sessions")
            return Response({'error': 'Active SSE session not found.'}, status=status.HTTP_400_BAD_REQUEST)
