import json
import urllib.request
import urllib.error
import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

logger = logging.getLogger(__name__)

class ResendEmailBackend(BaseEmailBackend):
    """Custom email backend for sending emails via Resend's HTTPS API."""
    
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        api_key = getattr(settings, 'RESEND_API_KEY', '')
        if not api_key:
            logger.error("Resend API key is not configured. Set RESEND_API_KEY in environment variables.")
            return 0
            
        sent_count = 0
        for message in email_messages:
            try:
                # Get the from email. Resend Onboarding allows sending from 'onboarding@resend.dev'
                from_email = message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', '')
                if not from_email or 'example.com' in from_email or 'soviplatform.com' in from_email:
                    # Fallback to a default onboarding address if domain is not verified yet
                    from_email = "onboarding@resend.dev"
                
                # If custom domain is set up, the merchant can override this
                if getattr(settings, 'DEFAULT_FROM_EMAIL', '') and 'resend.dev' not in getattr(settings, 'DEFAULT_FROM_EMAIL', ''):
                    from_email = settings.DEFAULT_FROM_EMAIL

                payload = {
                    "from": from_email,
                    "to": list(message.to),
                    "subject": message.subject,
                }
                
                # Check for HTML content in alternatives (standard django EmailMultiAlternatives)
                html_content = None
                if getattr(message, 'alternatives', None):
                    for alt in message.alternatives:
                        if alt[1] == 'text/html':
                            html_content = alt[0]
                            break
                            
                if html_content:
                    payload['html'] = html_content
                    payload['text'] = message.body
                else:
                    if getattr(message, 'content_subtype', '') == 'html':
                        payload['html'] = message.body
                    else:
                        payload['text'] = message.body
                
                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    method="POST"
                )
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = response.read().decode('utf-8')
                    logger.info(f"Email sent via Resend API successfully: {res_body}")
                    sent_count += 1
            except urllib.error.HTTPError as e:
                err_content = e.read().decode('utf-8')
                logger.error(f"Resend API returned HTTP error {e.code}: {err_content}", exc_info=True)
            except Exception as e:
                logger.error(f"Error sending email via Resend API: {str(e)}", exc_info=True)
                
        return sent_count
