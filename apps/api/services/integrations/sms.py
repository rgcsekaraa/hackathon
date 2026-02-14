"""
Twilio SMS integration.

Sends SMS to customers with photo upload links and booking confirmations.
Falls back to logging when no credentials are configured.
"""

from __future__ import annotations
import logging
from core.config import settings

logger = logging.getLogger(__name__)


async def send_sms(to: str, body: str) -> dict:
    """
    Send an SMS via Twilio.

    Returns {"status": "sent", "to": to} on success, or mock response if no credentials.
    """
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.info("[MOCK SMS] To: %s | Body: %s", to, body[:100])
        return {"status": "mock_sent", "to": to, "body": body}

    try:
        import httpx

        auth = (settings.twilio_account_sid, settings.twilio_auth_token)
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                auth=auth,
                data={
                    "From": settings.twilio_phone_number,
                    "To": to,
                    "Body": body,
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()

        logger.info("SMS sent to %s (SID: %s)", to, data.get("sid"))
        return {"status": "sent", "to": to, "sid": data.get("sid")}

    except Exception as e:
        logger.error("Twilio error: %s -- SMS not sent to %s", e, to)
        return {"status": "error", "to": to, "error": str(e)}


def build_photo_upload_url(lead_id: str, base_url: str = "http://localhost:3000") -> str:
    """Build the URL for the customer photo upload page."""
    return f"{base_url}/customer/upload/{lead_id}"


async def send_photo_upload_link(to: str, lead_id: str, base_url: str = "http://localhost:3000") -> dict:
    """Send an SMS with a link to upload photos."""
    upload_url = build_photo_upload_url(lead_id, base_url)
    body = (
        f"Thanks for calling! If you have photos of the issue, "
        f"please upload them here to get a more accurate quote: {upload_url}"
    )
    return await send_sms(to, body)


async def send_booking_confirmation(to: str, date: str, time_slot: str, total: float) -> dict:
    """Send booking confirmation SMS to customer."""
    body = (
        f"Your booking is confirmed! "
        f"Date: {date}, Time: {time_slot}. "
        f"Estimated total: ${total:.2f} (incl. GST). "
        f"See you then!"
    )
    return await send_sms(to, body)
