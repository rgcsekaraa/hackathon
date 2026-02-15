
"""
Outbound calling router.
Triggers a click-to-call flow:
1. Call the Tradie's verified mobile number.
2. When answering, bridge (Dial) the Customer.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.future import select

from core.deps import get_current_user
from core.config import settings
from db.session import get_db_context
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

class OutboundCallRequest(BaseModel):
    customer_enquiry_id: str | None = None
    customer_phone: str

@router.post("/voice/outbound")
async def start_outbound_call(
    req: OutboundCallRequest,
    user: User = Depends(get_current_user),
):
    """
    Initiate a bridge call: Business -> Tradie -> Customer.
    """
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(
            status_code=503,
            detail="Twilio is not configured for outbound calls",
        )

    # 1. Get Tradie's real phone number from profile
    try:
        async with get_db_context() as db:
            from models.lead import UserProfile
            # Assuming 1:1 user to profile for now or fetching the first one
            stmt = select(UserProfile).where(UserProfile.user_id == user.id)
            result = await db.execute(stmt)
            profile = result.scalar_one_or_none()
            
            tradie_phone = None
            if profile and profile.inbound_config:
                tradie_phone = (
                    profile.inbound_config.get("forward_to")
                    or profile.inbound_config.get("identifier")
                )
            
            if not tradie_phone:
                raise HTTPException(
                    status_code=400,
                    detail="Tradie forwarding number is not configured in inbound setup",
                )

    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        logger.error("Failed to fetch tradie profile: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to resolve tradie profile")

    # 2. Trigger Twilio Call
    try:
        import httpx
        auth = (settings.twilio_account_sid, settings.twilio_auth_token)
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json"
        
        # We call the TRADIE first.
        # When they answer, we execute TwiML to Dial the CUSTOMER.
        # We need a TwiML URL or use 'Twiml' parameter (if short)
        
        twiml = f"""
        <Response>
            <Say voice="Polly.Nicole" language="en-AU">Connecting you to your customer.</Say>
            <Dial callerId="{settings.twilio_phone_number}">
                {req.customer_phone}
            </Dial>
        </Response>
        """

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                auth=auth,
                data={
                    "From": settings.twilio_phone_number,
                    "To": tradie_phone,
                    "Twiml": twiml,
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()

        logger.info("Outbound call initiated: Tradie %s -> Customer %s (SID: %s)", 
                    tradie_phone, req.customer_phone, data.get("sid"))
        
        return {"status": "initiated", "sid": data.get("sid")}

    except Exception as e:
        import httpx
        if isinstance(e, httpx.HTTPStatusError):
            provider_detail = (e.response.text or "").strip()[:500]
            logger.error("Twilio outbound HTTP error %s: %s", e.response.status_code, provider_detail)
            raise HTTPException(
                status_code=502,
                detail=f"Twilio rejected the outbound call request ({e.response.status_code}): {provider_detail or 'no response body'}",
            )
        logger.error("Twilio outbound error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
