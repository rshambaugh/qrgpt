import openai
import os
import json
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from difflib import get_close_matches
from typing import Tuple, Optional
from ..models import Item as ItemModel, Space as SpaceModel

# OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY", "")

async def interpret_command(user_text: str, object_type: str, db: AsyncSession) -> dict:
    """
    Use OpenAI to convert user_text into a structured JSON-like command.
    """
    prompt = f"""
You are an assistant that converts user commands about {object_type}s into structured JSON.

We have {object_type}s. The user says things like:
"Where is my screwdriver?"
"Find {object_type} named 'Garage Shelf #1'"
"Find {object_type} named 'Rubber Gloves Box'"
"Where is the {object_type} named 'Two Tables'?"

Reply ONLY with valid JSON in this shape:
{{
  "action": "find_{object_type}",
  "{object_type}_name": "...",
  "extra_details": "..."
}}

No extra text outside the JSON.
"""

    user_msg = f"User says: {user_text}"
    print("[interpret_command] Sending to OpenAI:\nPrompt:", prompt)
    print("[interpret_command] User Message:", user_msg)

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_msg}
        ],
        temperature=0.3,
    )

    content = response["choices"][0]["message"]["content"].strip()
    print("[interpret_command] OpenAI Response:", content)

    try:
        command = json.loads(content)
        return command
    except json.JSONDecodeError:
        return {
            "action": "unknown",
            f"{object_type}_name": None,
            "extra_details": content
        }

def fuzzy_match(target_name: str, all_names: list[str]) -> Optional[str]:
    """
    Returns the single closest match if any, else None.
    The cutoff value (0.6) determines the minimum similarity ratio for a match.
    Lower values allow more leniency but may increase false positives.
    """
    if not target_name:
        return None
    matches = get_close_matches(target_name, all_names, n=1, cutoff=0.6)
    return matches[0] if matches else None

async def parse_and_execute_command(cmd: dict, object_type: str, db: AsyncSession) -> str:
    """
    Given a structured cmd (action, item_name, space_name, extra_details),
    execute the appropriate action.
    """
    action = cmd.get("action", "unknown")
    name = (cmd.get(f"{object_type}_name") or "").strip().lower()
    extra = cmd.get("extra_details", "")

    print(f"[parse_and_execute_command] Parsed command - Action: {action}, Object Type: {object_type}, Name: {name}, Extra: {extra}")

    try:
        if object_type == "item":
            result_items = await db.execute(
                select(ItemModel).options(joinedload(ItemModel.space))
            )
            items = result_items.unique().scalars().all()
            item_names = [i.name.lower() for i in items]

            async def get_item_obj(name: str) -> Tuple[Optional[ItemModel], Optional[str]]:
                if not name:
                    return None, "No item name provided."
                exact_matches = [i for i in items if i.name.lower() == name]
                if len(exact_matches) == 1:
                    return exact_matches[0], None
                best_guess = fuzzy_match(name, item_names)
                if best_guess:
                    matched = [i for i in items if i.name.lower() == best_guess]
                    if matched:
                        return matched[0], f"Assumed you meant '{best_guess}' for the item."
                return None, f"No item found matching '{name}'."

            item_obj, item_err = await get_item_obj(name)
            if item_obj:
                return f"Item '{item_obj.name}' is located in space '{item_obj.space.name}'."
            return item_err

        if object_type == "space":
            result_spaces = await db.execute(
                select(SpaceModel).options(joinedload(SpaceModel.items))
            )
            spaces = result_spaces.unique().scalars().all()
            space_names = [s.name.lower() for s in spaces]

            async def get_space_obj(name: str) -> Tuple[Optional[SpaceModel], Optional[str]]:
                if not name:
                    return None, "No space name provided."
                exact_matches = [s for s in spaces if s.name.lower() == name]
                if len(exact_matches) == 1:
                    return exact_matches[0], None
                best_guess = fuzzy_match(name, space_names)
                if best_guess:
                    matched = [s for s in spaces if s.name.lower() == best_guess]
                    if matched:
                        return matched[0], f"Assumed you meant '{best_guess}' for the space."
                return None, f"No space found matching '{name}'."

            space_obj, space_err = await get_space_obj(name)
            if space_obj:
                return f"Space '{space_obj.name}' found."
            return space_err

        return "Unsupported action."

    except Exception as e:
        print(f"[Error] {str(e)}")
        return f"An error occurred: {str(e)}"
