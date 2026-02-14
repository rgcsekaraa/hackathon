from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from db.session import get_db
from core.deps import get_current_user
from models.user import User
from models.workspace import WorkspaceComponent
from services.workspace_service import _model_to_dict

router = APIRouter()

@router.get("/search")
async def global_search(
    q: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search across all workspace components (tasks, notes, events) for the current user.
    Uses standard ILIKE for multi-field search.
    """
    if not q:
        return {"results": []}

    query_str = f"%{q}%"
    
    # Search in WorkspaceComponents (title, description)
    result = await db.execute(
        select(WorkspaceComponent).where(
            WorkspaceComponent.user_id == current_user.id,
            or_(
                WorkspaceComponent.title.ilike(query_str),
                WorkspaceComponent.description.ilike(query_str)
            )
        )
    )
    components = result.scalars().all()
    
    # Format results
    results = []
    for comp in components:
        results.append({
            "id": comp.id,
            "type": comp.type if hasattr(comp, 'type') else "component",
            "title": comp.title,
            "snippet": comp.description[:100] if comp.description else "",
            "url": f"/dashboard?componentId={comp.id}"
        })

    return {"results": results}
