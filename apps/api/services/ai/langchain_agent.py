"""
LangChain-based AI agent for lead classification and quote pipeline.

Replaces raw OpenRouter HTTP calls with structured LangChain chains
for type-safe extraction, better prompt management, and chain composition.
"""

import json
import logging
from typing import Optional

from pydantic import BaseModel, Field

from core.config import settings
from .prompts import (
    CLASSIFY_LEAD_TEMPLATE,
    CLARIFY_TEMPLATE,
    SUMMARIZE_QUOTE_TEMPLATE,
    VISION_ENHANCE_TEMPLATE,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Output Schemas (Pydantic for structured extraction)
# ---------------------------------------------------------------------------

class ClassifiedLead(BaseModel):
    """Structured output from lead classification."""
    job_type: str = Field(description="Type of plumbing job")
    address: str = Field(default="unknown", description="Street address")
    suburb: str = Field(default="unknown", description="Suburb name")
    urgency: str = Field(default="standard", description="Urgency level")
    description: str = Field(default="", description="Brief description of the issue")
    parts_needed: list[str] = Field(default_factory=list, description="Likely parts needed")


class VisionEnhancement(BaseModel):
    """Structured output from vision analysis enhancement."""
    confirmation: str = Field(default="unclear")
    severity: str = Field(default="moderate")
    additional_parts: list[str] = Field(default_factory=list)
    notes: str = Field(default="")


# ---------------------------------------------------------------------------
# LangChain Chain Wrappers
# ---------------------------------------------------------------------------

async def classify_lead(
    text: str,
    context: str = "",
) -> ClassifiedLead:
    """
    Classify customer text into structured lead data using LangChain.
    
    Falls back to keyword-based classification if LLM is unavailable.
    """
    api_key = settings.openrouter_api_key
    if not api_key:
        logger.info("No OpenRouter key — using fallback classification")
        return _fallback_classify(text)

    try:
        # Dynamic import to avoid startup cost if not used
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import JsonOutputParser

        llm = ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=0.1,
            max_tokens=500,
        )

        prompt = ChatPromptTemplate.from_template(CLASSIFY_LEAD_TEMPLATE)
        parser = JsonOutputParser(pydantic_object=ClassifiedLead)

        chain = prompt | llm | parser

        result = await chain.ainvoke({"text": text, "context": context})
        logger.info("LangChain classification: %s", result)

        return ClassifiedLead(**result)

    except ImportError:
        logger.warning("langchain not installed — using fallback")
        return _fallback_classify(text)
    except Exception as exc:
        logger.error("LangChain classification failed: %s — using fallback", exc)
        return _fallback_classify(text)


async def generate_clarification(
    job_type: str,
    address: str,
    urgency: str,
    description: str,
    missing_fields: str,
) -> str:
    """Generate follow-up questions for incomplete lead data."""
    api_key = settings.openrouter_api_key
    if not api_key:
        return _fallback_clarification(missing_fields)

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate

        llm = ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=0.7,
            max_tokens=200,
        )

        prompt = ChatPromptTemplate.from_template(CLARIFY_TEMPLATE)
        chain = prompt | llm

        result = await chain.ainvoke({
            "job_type": job_type,
            "address": address,
            "urgency": urgency,
            "description": description,
            "missing_fields": missing_fields,
        })

        return result.content

    except Exception as exc:
        logger.error("Clarification generation failed: %s", exc)
        return _fallback_clarification(missing_fields)


async def generate_quote_narration(
    customer_name: str,
    job_type: str,
    address: str,
    suburb: str,
    quote_total: float,
    scheduled_date: str,
    scheduled_slot: str,
    business_name: str,
) -> str:
    """Generate a spoken quote summary for TTS."""
    api_key = settings.openrouter_api_key
    if not api_key:
        return _fallback_narration(customer_name, quote_total, scheduled_date, scheduled_slot, business_name)

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate

        llm = ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=0.6,
            max_tokens=200,
        )

        prompt = ChatPromptTemplate.from_template(SUMMARIZE_QUOTE_TEMPLATE)
        chain = prompt | llm

        result = await chain.ainvoke({
            "customer_name": customer_name,
            "job_type": job_type,
            "address": address,
            "suburb": suburb,
            "quote_total": f"{quote_total:.2f}",
            "scheduled_date": scheduled_date,
            "scheduled_slot": scheduled_slot,
            "business_name": business_name,
        })

        return result.content

    except Exception as exc:
        logger.error("Quote narration failed: %s", exc)
        return _fallback_narration(customer_name, quote_total, scheduled_date, scheduled_slot, business_name)


async def enhance_vision_analysis(
    vision_labels: str,
    job_context: str,
) -> VisionEnhancement:
    """Enhance Vision API labels with plumbing expertise."""
    api_key = settings.openrouter_api_key
    if not api_key:
        return VisionEnhancement()

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import JsonOutputParser

        llm = ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=0.2,
            max_tokens=300,
        )

        prompt = ChatPromptTemplate.from_template(VISION_ENHANCE_TEMPLATE)
        parser = JsonOutputParser(pydantic_object=VisionEnhancement)

        chain = prompt | llm | parser
        result = await chain.ainvoke({
            "vision_labels": vision_labels,
            "job_context": job_context,
        })

        return VisionEnhancement(**result)

    except Exception as exc:
        logger.error("Vision enhancement failed: %s", exc)
        return VisionEnhancement()


# ---------------------------------------------------------------------------
# Fallbacks (keyword-based, no LLM needed)
# ---------------------------------------------------------------------------

_JOB_KEYWORDS = {
    "tap_repair": ["tap", "faucet", "drip", "dripping", "washer"],
    "tap_replacement": ["replace tap", "new tap", "new faucet"],
    "toilet_repair": ["toilet", "cistern", "flush", "running toilet"],
    "toilet_replacement": ["replace toilet", "new toilet"],
    "blocked_drain": ["blocked", "clogged", "drain", "slow drain", "backed up"],
    "hot_water_repair": ["hot water", "no hot water", "warm water", "lukewarm"],
    "hot_water_replacement": ["replace hot water", "new hot water system"],
    "leak_repair": ["leak", "leaking", "water damage", "drip"],
    "pipe_burst": ["burst", "broken pipe", "flooding", "water everywhere"],
    "gas_fitting": ["gas", "gas leak", "gas fitting", "gas hot water"],
    "roof_plumbing": ["roof", "gutter", "downpipe", "guttering"],
    "bathroom_reno": ["renovation", "reno", "bathroom reno", "remodel"],
    "general_plumbing": ["plumber", "plumbing"],
}

_URGENCY_KEYWORDS = {
    "emergency": ["emergency", "flood", "flooding", "burst", "gas leak", "urgent", "asap", "now"],
    "urgent": ["today", "same day", "can't wait", "really need"],
    "standard": ["this week", "soon", "couple of days"],
    "flexible": ["no rush", "whenever", "next week", "quote", "estimate"],
}

_SUBURB_KEYWORDS = [
    "Southport", "Burleigh", "Burleigh Heads", "Miami", "Palm Beach",
    "Mermaid Beach", "Broadbeach", "Surfers Paradise", "Robina",
    "Nerang", "Mudgeeraba", "Currumbin", "Coolangatta", "Varsity Lakes",
    "Helensvale", "Coomera", "Ormeau", "Oxenford", "Labrador",
]


def _fallback_classify(text: str) -> ClassifiedLead:
    """Keyword-based classification when LLM is unavailable."""
    text_lower = text.lower()

    # Detect job type
    job_type = "general_plumbing"
    for jt, keywords in _JOB_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            job_type = jt
            break

    # Detect urgency
    urgency = "standard"
    for urg, keywords in _URGENCY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            urgency = urg
            break

    # Detect suburb
    suburb = "unknown"
    for sub in _SUBURB_KEYWORDS:
        if sub.lower() in text_lower:
            suburb = sub
            break

    return ClassifiedLead(
        job_type=job_type,
        address="unknown",
        suburb=suburb,
        urgency=urgency,
        description=text[:200],
        parts_needed=[],
    )


def _fallback_clarification(missing: str) -> str:
    """Fallback clarification when LLM is unavailable."""
    return f"G'day! Just a couple more details — could you let us know {missing}? No worries, just want to make sure we send the right gear."


def _fallback_narration(
    name: str, total: float, date: str, slot: str, business: str
) -> str:
    """Fallback quote narration when LLM is unavailable."""
    return (
        f"Hi {name}, your quote from {business} is ${total:.2f} including GST. "
        f"Your plumber is booked for {date} between {slot}. "
        f"We'll give you a call when we're on our way. Cheers!"
    )
