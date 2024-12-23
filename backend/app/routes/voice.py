from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from ..utils.db import get_db
from ..services.voice import interpret_command, parse_and_execute_command

router = APIRouter()

@router.post("/interpret")
async def interpret_voice_command(payload: Dict, db: AsyncSession = Depends(get_db)):
    user_text = payload.get("text", "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="No text command provided.")

    try:
        structured_cmd = await interpret_command(user_text, db)
        print("[voice] structured_cmd:", structured_cmd)

        response_message = await parse_and_execute_command(structured_cmd, db)
        return {
            "parsedResponse": structured_cmd,
            "finalResult": {
                "success": True,
                "message": response_message
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
