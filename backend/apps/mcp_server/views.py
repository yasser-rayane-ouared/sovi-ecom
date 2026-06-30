import json
import threading
from django.db import close_old_connections
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .authentication import McpApiKeyAuthentication
from .models import McpToolCallLog
from .tools.registry import list_tools, get_tool, ToolError

def log_tool_call_async(store, api_key, tool_name, arguments, success, result_summary="", error_message=""):
    def run():
        try:
            McpToolCallLog.objects.create(
                store=store,
                api_key=api_key,
                tool_name=tool_name,
                arguments=arguments,
                result_summary=result_summary,
                success=success,
                error_message=error_message
            )
        except Exception:
            pass
        finally:
            close_old_connections()
    threading.Thread(target=run, daemon=True).start()


class McpJsonRpcView(APIView):
    authentication_classes = [McpApiKeyAuthentication]
    permission_classes = []

    def post(self, request):
        if not getattr(request, 'store', None):
            return Response({
                "jsonrpc": "2.0",
                "id": request.data.get("id"),
                "error": {
                    "code": -32001,
                    "message": "Store context not set or unauthorized."
                }
            }, status=status.HTTP_200_OK)

        data = request.data
        if not isinstance(data, dict):
            return Response({
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32700,
                    "message": "Parse error."
                }
            }, status=status.HTTP_200_OK)

        jsonrpc = data.get("jsonrpc")
        method = data.get("method")
        params = data.get("params", {})
        request_id = data.get("id")

        if jsonrpc != "2.0":
            return Response({
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32600,
                    "message": "Invalid request."
                }
            }, status=status.HTTP_200_OK)

        if method == "initialize":
            return Response({
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": "2025-11-25",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "Sovi-Store-MCP-Server",
                        "version": "1.0.0"
                    }
                }
            })

        elif method == "tools/list":
            return Response({
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "tools": list_tools()
                }
            })

        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            tool = get_tool(tool_name)
            if not tool:
                log_tool_call_async(
                    store=request.store,
                    api_key=getattr(request, 'mcp_api_key', None),
                    tool_name=tool_name or "unknown",
                    arguments=arguments,
                    success=False,
                    error_message=f"Tool '{tool_name}' not found."
                )
                return Response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: '{tool_name}'"
                    }
                })

            try:
                result_data = tool["handler"](request.store, arguments)
                
                log_tool_call_async(
                    store=request.store,
                    api_key=getattr(request, 'mcp_api_key', None),
                    tool_name=tool_name,
                    arguments=arguments,
                    result_summary=f"Success: {str(result_data)[:100]}...",
                    success=True
                )

                return Response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(result_data, ensure_ascii=False)
                            }
                        ],
                        "isError": False
                    }
                })

            except ToolError as te:
                log_tool_call_async(
                    store=request.store,
                    api_key=getattr(request, 'mcp_api_key', None),
                    tool_name=tool_name,
                    arguments=arguments,
                    success=False,
                    error_message=str(te)
                )
                return Response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": f"Error: {str(te)}"
                            }
                        ],
                        "isError": True
                    }
                })

            except Exception as e:
                error_msg = f"Unexpected error: {str(e)}"
                log_tool_call_async(
                    store=request.store,
                    api_key=getattr(request, 'mcp_api_key', None),
                    tool_name=tool_name,
                    arguments=arguments,
                    success=False,
                    error_message=error_msg
                )
                return Response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {
                        "code": -32603,
                        "message": "Internal error.",
                        "data": error_msg
                    }
                })

        else:
            return Response({
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: '{method}'"
                }
            })
