from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict

from ..utils.db import get_db
from ..services.voice import interpret_command, parse_and_execute_command

router = APIRouter()

@router.post("/interpret")
async def interpret_voice_command(payload: Dict, db: AsyncSession = Depends(get_db)):
    """
    1) Interpret the user text with OpenAI.
    2) Parse the structured command to see what the user wants (move item, add space, etc.).
    3) Execute or ask for more info if ambiguous.
    """
    user_text = payload.get("text", "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="No text command provided.")

    try:
        structured_cmd = await interpret_command(user_text, db)
        # structured_cmd is the JSON-like instructions from OpenAI
        print("[voice] structured_cmd:", structured_cmd)

        response_message = await parse_and_execute_command(structured_cmd, db)
        return {"message": response_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
