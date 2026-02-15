# Environment Setup Checklist

Use this checklist to quickly verify all required environment variables before running or deploying.

## 1) API env (`apps/api/.env`)

Copy example first:

```bash
cp apps/api/.env.example apps/api/.env
```

### Local Development Template

```dotenv
# Core
DEBUG=false
SECRET_KEY=change_me_to_a_long_random_secret
DATABASE_URL=sqlite+aiosqlite:///./spatial_voice.db
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]

# Bootstrap admin (optional but useful for local)
ADMIN_EMAILS=["superadmin@sophiie.ai"]
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_ALIAS=demo-SA
BOOTSTRAP_ADMIN_EMAIL=superadmin@sophiie.ai
BOOTSTRAP_ADMIN_PASSWORD=d3m0-p@s5
BOOTSTRAP_ADMIN_NAME=Demo Super Admin

# AI (required for real features)
OPENROUTER_API_KEY=or_v1_xxx
OPENROUTER_MODEL=anthropic/claude-sonnet-4
OPENROUTER_VISION_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Vision + distance + live pricing (optional but recommended)
GOOGLE_CLOUD_VISION_KEY=
GOOGLE_MAPS_API_KEY=
SERPAPI_API_KEY=
PRICING_LIVE_ENABLED=true

# Voice stack (required for live voice)
DEEPGRAM_API_KEY=dg_xxx
ELEVENLABS_API_KEY=el_xxx
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
LIVEKIT_API_KEY=LK_xxx
LIVEKIT_API_SECRET=LK_SECRET_xxx
LIVEKIT_URL=wss://your-livekit-domain.livekit.cloud

# Twilio (required for live inbound call + SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Cache (optional)
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379

# Fallback pricing/business profile
DEFAULT_BUSINESS_NAME=Gold Coast Plumbing
DEFAULT_BASE_ADDRESS=Burleigh Heads, QLD
DEFAULT_CALLOUT_FEE=80.0
DEFAULT_HOURLY_RATE=95.0
DEFAULT_MARKUP_PCT=15.0
```

### Production Template

```dotenv
# Core
DEBUG=false
SECRET_KEY=<strong-random-secret>
DATABASE_URL=<production-db-url>
FRONTEND_URL=https://<customer-portal-domain>
CORS_ORIGINS=["https://<customer-portal-domain>","https://<admin-portal-domain>"]

# Admin bootstrap (disable after first setup)
BOOTSTRAP_ADMIN_ENABLED=false
ADMIN_EMAILS=["<admin-email>"]

# AI
OPENROUTER_API_KEY=<openrouter-key>
OPENROUTER_MODEL=anthropic/claude-sonnet-4
OPENROUTER_VISION_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Integrations
GOOGLE_CLOUD_VISION_KEY=<optional>
GOOGLE_MAPS_API_KEY=<optional>
SERPAPI_API_KEY=<optional>
PRICING_LIVE_ENABLED=true

# Voice
DEEPGRAM_API_KEY=<deepgram-key>
ELEVENLABS_API_KEY=<elevenlabs-key>
ELEVENLABS_VOICE_ID=<voice-id>
LIVEKIT_API_KEY=<livekit-key>
LIVEKIT_API_SECRET=<livekit-secret>
LIVEKIT_URL=wss://<livekit-domain>

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# OAuth (if used)
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=https://<api-domain>/auth/google/callback

# Optional cache
REDIS_ENABLED=true
REDIS_URL=redis://<redis-host>:6379
```

## 2) Frontend env files

### Customer Portal (`apps/customer/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Admin Portal (`apps/admin/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

For production, switch to your HTTPS/WSS endpoints.

## 3) Live Inbound Call Checklist (Twilio + LiveKit)

1. Confirm API + both portals + both workers are running.
2. Expose API publicly for Twilio webhook testing:
   - `ngrok http 8000`
3. In Twilio Number config:
   - `A Call Comes In` -> `POST https://<ngrok-domain>/api/voice/incoming`
4. Place a real call to your Twilio number.
5. Verify:
   - Lead appears in customer/admin portals.
   - SMS photo link is sent when enabled.
   - Uploaded image triggers analysis pipeline.

## 4) Quick Verification Commands

```bash
# API health
curl http://localhost:8000/health

# Port listeners
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:3001 -sTCP:LISTEN

# NX all-in-one
npx nx run-many --target=serve --projects=api,customer,admin --parallel=3 --output-style=stream
```
