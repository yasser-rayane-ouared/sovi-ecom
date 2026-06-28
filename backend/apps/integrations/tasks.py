"""Background Celery tasks for third party integrations."""
import json
import logging
from celery import shared_task
from apps.orders.models import Order

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def sync_order_to_google_sheet(self, order_id):
    """Sync a newly created or updated order to Google Sheets."""
    try:
        order = Order.objects.select_related('store', 'wilaya', 'commune').get(id=order_id)
        store = order.store

        from .models import GoogleSheetsConfig
        config = GoogleSheetsConfig.objects.filter(store=store, is_active=True).first()

        if not config or not config.credentials_json or not config.spreadsheet_id:
            logger.info(f"Google Sheets config not active or missing for store {store.name}")
            return

        import gspread
        from google.oauth2.service_account import Credentials

        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]

        creds_dict = json.loads(config.credentials_json)
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        client = gspread.authorize(creds)

        sh = client.open_by_key(config.spreadsheet_id)
        try:
            worksheet = sh.worksheet(config.sheet_name)
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title=config.sheet_name, rows="100", cols="20")
            # Write headers
            worksheet.append_row([
                'Order ID', 'Order Number', 'Date', 'Full Name', 'Phone', 'Phone 2',
                'Wilaya', 'Commune', 'Address', 'Total (DZD)', 'Status', 'Notes'
            ])

        # Prepare row data
        row = [
            str(order.id),
            order.order_number,
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            order.full_name,
            order.phone,
            order.phone2,
            order.wilaya.name_ar,
            order.commune.name_ar,
            order.address,
            float(order.total),
            order.get_status_display(),
            order.notes
        ]

        # Check if the order already exists in the sheet to prevent duplicates
        try:
            cell = worksheet.find(str(order.id), in_column=1)
            row_num = cell.row
            worksheet.update(f"A{row_num}:L{row_num}", [row])
            logger.info(f"Successfully updated order {order.order_number} in Google Sheet (row {row_num}).")
        except gspread.CellNotFound:
            worksheet.append_row(row)
            logger.info(f"Successfully appended order {order.order_number} to Google Sheet.")
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found in database. Skipping sheets sync.")
        return
    except Exception as e:
        logger.error(f"Error syncing order to Google Sheet: {str(e)}", exc_info=True)
        # Calculate exponential backoff retry delay (e.g. 60s, 120s, 240s, 480s...)
        try:
            countdown = min(2 ** self.request.retries * 60, 3600)
            raise self.retry(exc=e, countdown=countdown)
        except Exception as retry_exc:
            # Let celery bubble up final failed attempts
            raise retry_exc


def _send_telegram_for_order(order_id, is_new=True):
    """
    Core logic: send a Telegram notification for an order.
    Called directly (sync) from order creation, or via Celery task.
    """
    try:
        import html
        import requests
        from django.conf import settings
        from apps.orders.models import Order
        from .models import TelegramConfig

        bot_token = settings.TELEGRAM_BOT_TOKEN
        if not bot_token:
            logger.error("Platform Telegram Bot Token is not configured in settings.")
            return

        order = Order.objects.select_related('store', 'wilaya', 'commune').prefetch_related('items__product').get(id=order_id)
        store = order.store

        config = TelegramConfig.objects.filter(store=store, is_active=True).first()
        if not config or not config.chat_id:
            logger.info(f"No active Telegram config or chat_id for store {store.name}. Skipping.")
            return

        # Check preferences
        if is_new and not config.send_on_create:
            return
        if not is_new and not config.send_on_status_change:
            return

        lang = store.language or 'ar'
        if lang == 'ar':
            phone2_section = f"\n📞 <b>الهاتف 2:</b> {order.phone2}" if order.phone2 else ""
        elif lang == 'fr':
            phone2_section = f"\n📞 <b>Téléphone 2:</b> {order.phone2}" if order.phone2 else ""
        else:
            phone2_section = f"\n📞 <b>Phone 2:</b> {order.phone2}" if order.phone2 else ""

        # Items list
        items_lines = []
        for item in order.items.all():
            variant_str = f" ({html.escape(item.variant_name)})" if item.variant_name else ""
            items_lines.append(f"• {item.quantity}x {html.escape(item.product_title)}{variant_str} — {float(item.price):,.0f} DZD")
        items_list = "\n".join(items_lines)

        esc_name = html.escape(order.full_name)
        esc_wilaya = html.escape(order.wilaya.name_ar if lang == 'ar' else order.wilaya.name_fr) if order.wilaya else ""
        esc_commune = html.escape(order.commune.name_ar if lang == 'ar' else order.commune.name_fr) if order.commune else ""
        esc_address = html.escape(order.address or "")
        esc_notes = html.escape(order.notes or "")

        if is_new:
            if lang == 'ar':
                text = (
                    f"🔔 <b>طلبية جديدة رقم {order.order_number}</b>\n\n"
                    f"👤 <b>العميل:</b> {esc_name}\n"
                    f"📞 <b>الهاتف:</b> {order.phone}{phone2_section}\n"
                    f"📍 <b>الولاية/البلدية:</b> {esc_wilaya}، {esc_commune}\n"
                    f"🏠 <b>العنوان:</b> {esc_address}\n\n"
                    f"🛒 <b>المنتجات:</b>\n{items_list}\n\n"
                    f"💰 <b>المجموع الفرعي:</b> {float(order.subtotal):,.0f} د.ج\n"
                    f"🚚 <b>الشحن:</b> {float(order.delivery_price):,.0f} د.ج\n"
                    f"💵 <b>إجمالي الطلب:</b> {float(order.total):,.0f} د.ج\n\n"
                    f"📝 <b>ملاحظات:</b> {esc_notes}"
                )
            elif lang == 'fr':
                text = (
                    f"🔔 <b>Nouvelle Commande #{order.order_number}</b>\n\n"
                    f"👤 <b>Client:</b> {esc_name}\n"
                    f"📞 <b>Téléphone:</b> {order.phone}{phone2_section}\n"
                    f"📍 <b>Wilaya/Commune:</b> {esc_wilaya}، {esc_commune}\n"
                    f"🏠 <b>Adresse:</b> {esc_address}\n\n"
                    f"🛒 <b>Produits:</b>\n{items_list}\n\n"
                    f"💰 <b>Sous-total:</b> {float(order.subtotal):,.0f} DZD\n"
                    f"🚚 <b>Livraison:</b> {float(order.delivery_price):,.0f} DZD\n"
                    f"💵 <b>Total:</b> {float(order.total):,.0f} DZD\n\n"
                    f"📝 <b>Notes:</b> {esc_notes}"
                )
            else:
                text = (
                    f"🔔 <b>New Order #{order.order_number}</b>\n\n"
                    f"👤 <b>Customer:</b> {esc_name}\n"
                    f"📞 <b>Phone:</b> {order.phone}{phone2_section}\n"
                    f"📍 <b>Wilaya/Commune:</b> {esc_wilaya}، {esc_commune}\n"
                    f"🏠 <b>Address:</b> {esc_address}\n\n"
                    f"🛒 <b>Products:</b>\n{items_list}\n\n"
                    f"💰 <b>Subtotal:</b> {float(order.subtotal):,.0f} DZD\n"
                    f"🚚 <b>Delivery:</b> {float(order.delivery_price):,.0f} DZD\n"
                    f"💵 <b>Total:</b> {float(order.total):,.0f} DZD\n\n"
                    f"📝 <b>Notes:</b> {esc_notes}"
                )
        else:
            status_display = order.get_status_display()
            latest_history = order.status_history.order_by('-changed_at').first()
            note_str = html.escape(latest_history.note) if latest_history and latest_history.note else ""
            if lang == 'ar':
                text = (
                    f"🔄 <b>تحديث حالة الطلبية رقم {order.order_number}</b>\n\n"
                    f"👤 <b>العميل:</b> {esc_name}\n"
                    f"📈 <b>الحالة الجديدة:</b> {status_display}\n"
                    f"📝 <b>ملاحظة:</b> {note_str}"
                )
            elif lang == 'fr':
                text = (
                    f"🔄 <b>Mise à jour de la commande #{order.order_number}</b>\n\n"
                    f"👤 <b>Client:</b> {esc_name}\n"
                    f"📈 <b>Nouveau Statut:</b> {status_display}\n"
                    f"📝 <b>Note:</b> {note_str}"
                )
            else:
                text = (
                    f"🔄 <b>Order #{order.order_number} Status Updated</b>\n\n"
                    f"👤 <b>Customer:</b> {esc_name}\n"
                    f"📈 <b>New Status:</b> {status_display}\n"
                    f"📝 <b>Note:</b> {note_str}"
                )

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': config.chat_id,
            'text': text.strip(),
            'parse_mode': 'HTML'
        }
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code != 200:
            logger.error(f"Telegram API error: {resp.status_code} — {resp.text}")
        else:
            logger.info(f"Telegram notification sent for order {order_id} to chat {config.chat_id}")
    except Exception as e:
        logger.error(f"Error in _send_telegram_for_order({order_id}): {str(e)}", exc_info=True)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_telegram_order_notification(self, order_id, is_new=True):
    """Celery task wrapper — calls the core send function."""
    try:
        _send_telegram_for_order(order_id, is_new=is_new)
    except Exception as e:
        logger.error(f"Celery Telegram task error: {str(e)}", exc_info=True)
        try:
            countdown = min(2 ** self.request.retries * 60, 1800)
            raise self.retry(exc=e, countdown=countdown)
        except Exception as retry_exc:
            raise retry_exc

