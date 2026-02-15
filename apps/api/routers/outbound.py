
"""
Outbound calling router.
Triggers a click-to-call flow:
1. Call the Tradie's verified mobile number.
2. When answering, bridge (Dial) the Customer.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.future import select

from core.deps import get_current_user
from core.config import settings
from db.session import get_db_context
from models.lead import UserResult
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
        logger.warning("Mocking outbound call to %s", req.customer_phone)
        return {"status": "mock_initiated", "message": "Twilio not configured"}

    # 1. Get Tradie's real phone number from profile
    try:
        async with get_db_context() as db:
            from models.lead import UserProfile
            # Assuming 1:1 user to profile for now or fetching the first one
            stmt = select(UserProfile).where(UserProfile.user_id == user.id)
            result = await db.execute(stmt)
            profile = result.scalar_one_or_none()
            
            tradie_phone = None
            if profile and profile.inbound_config and "forward_to" in profile.inbound_config:
                 tradie_phone = profile.inbound_config["forward_to"]
            
            if not tradie_phone:
                # Fallback to user's phone if stored in User model (it isn't usually)
                # Or require it in request? 
                # For hackathon, let's fallback to a default or error
                # return {"error": "Tradie phone number not found in profile"}
                # MOCK Fallback
                tradie_phone = user.phone or "+61400000000" 

    except Exception as exc:
        logger.error("Failed to fetch tradie profile: %s", exc)
        tradie_phone = "+61400000000" # Safe fallback for dev

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
        logger.error("Twilio outbound error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
