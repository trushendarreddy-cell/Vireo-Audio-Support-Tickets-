"""Pydantic schemas for the Vireo Support Intelligence AI Analyst."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the sender, e.g. 'user' or 'assistant'")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user query or analytical question")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Recent conversation history")

class AIAnalystResponse(BaseModel):
    answer: str = Field(..., description="High-level narrative executive summary")
    analysis: str = Field(..., description="Detailed operational and business interpretation")
    evidence: List[str] = Field(default_factory=list, description="Concrete metrics, data points, and observed facts")
    data_used: List[str] = Field(default_factory=list, description="Citations of data sources, policy rules, and date windows")
    relevant_tickets: List[str] = Field(default_factory=list, description="Sample ticket IDs supporting this finding")
    provider: str = Field(..., description="Provider that generated the response: gemini | groq | nemotron | local")
    model: str = Field(..., description="The exact model identifier used")
    fallback_used: bool = Field(default=False, description="Whether fallback was triggered")
    fallback_chain: List[str] = Field(default_factory=list, description="Chain of attempted providers")
    latency_ms: int = Field(default=0, description="Inference latency in milliseconds")

class ProviderHealth(BaseModel):
    name: str
    configured: bool
    model: str
    status: str  # "ready" | "missing_key" | "rate_limited" | "error"
    error_message: Optional[str] = None

class AIStatusResponse(BaseModel):
    status: str
    primary_provider: str
    fallback_providers: List[str]
    providers: Dict[str, ProviderHealth]
    data_grounding: str = "authoritative_deterministic_vireo_dataset"
