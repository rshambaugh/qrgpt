import openai
import os
import json
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Item as ItemModel, Space as SpaceModel

# OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY", "")


async def interpret_command(user_text: str, db: AsyncSession) -> dict:
    """
    Use OpenAI to convert user_text into a structured JSON-like command.
    """
    prompt = f"""
You are an assistant that converts user commands about items/spaces into structured JSON.

We have items and spaces. The user says things like:
"Move the hammer to the garage"
"Where is my screwdriver?"
"Create a new space named 'Attic'"
"Delete the item named 'Broken toy'"
"Add a new item named 'laptop charger' to 'Bedroom Shelf'"
etc.

Reply ONLY with valid JSON in this shape:
{{
  "action": "...",
  "item_name": "...",
  "space_name": "...",
  "extra_details": "..."
}}
Where 'action' is one of:
["create_item", "move_item", "delete_item", "find_item", "create_space", "move_space", "delete_space", "unknown"]

If uncertain, set action to "unknown".
No extra text outside the JSON.
"""

    user_msg = f"User says: {user_text}"

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_msg}
        ],
        temperature=0.3,
    )

    content = response["choices"][0]["message"]["content"].strip()
    print("[voice] raw LLM output:", content)

    try:
        command = json.loads(content)
        return command
    except json.JSONDecodeError:
        return {"action": "unknown", "item_name": None, "space_name": None, "extra_details": content}


async def parse_and_execute_command(cmd: dict, db: AsyncSession) -> str:
    """
    Given a structured cmd (action, item_name, space_name, extra_details),
    execute the appropriate action.
    """
    action = cmd.get("action", "unknown")
    item_name = (cmd.get("item_name") or "").strip().lower()
    space_name = (cmd.get("space_name") or "").strip().lower()
    extra = cmd.get("extra_details", "")

    print(f"[voice] Parsed command - Action: {action}, Item: {item_name}, Space: {space_name}, Extra: {extra}")

    try:
        # Fetch items and spaces within their own async-safe context
        result_items = await db.execute(select(ItemModel).options(joinedload(ItemModel.space)))
        items = result_items.scalars().all()

        result_spaces = await db.execute(select(SpaceModel).options(joinedload(SpaceModel.items)))
        spaces = result_spaces.scalars().all()

        # Helper functions
        def match_items(name):
            return [i for i in items if i.name.lower() == name]

        def match_spaces(name):
            return [s for s in spaces if s.name.lower() == name]

        # Action Handlers
        if action == "move_item":
            if not item_name or not space_name:
                return "Both item name and space name are required to move an item."

            matched_items = match_items(item_name)
            if len(matched_items) == 0:
                return f"No item found named '{item_name}'."
            elif len(matched_items) > 1:
                item_list = ", ".join([f"ID:{it.id}({it.name})" for it in matched_items])
                return f"Multiple items named '{item_name}'. Please specify which one: {item_list}"
            item_obj = matched_items[0]

            matched_spaces = match_spaces(space_name)
            if len(matched_spaces) == 0:
                return f"No space found named '{space_name}'."
            elif len(matched_spaces) > 1:
                space_list = ", ".join([f"ID:{sp.id}({sp.name})" for sp in matched_spaces])
                return f"Multiple spaces named '{space_name}'. Please specify which one: {space_list}"
            space_obj = matched_spaces[0]

            item_obj.space_id = space_obj.id
            await db.commit()
            return f"Moved '{item_obj.name}' to '{space_obj.name}'."

        elif action == "find_item":
            if not item_name:
                return "No item name provided. Example: 'Where is my hammer?'"
            matched_items = match_items(item_name)
            if len(matched_items) == 0:
                return f"No item found named '{item_name}'."
            elif len(matched_items) > 1:
                item_list = ", ".join([f"ID:{it.id}" for it in matched_items])
                return f"Multiple items named '{item_name}'. Please specify which one: {item_list}"
            item_obj = matched_items[0]
            if item_obj.space:
                return f"'{item_obj.name}' is in space '{item_obj.space.name}'."
            else:
                return f"'{item_obj.name}' is not in any space."

        elif action == "create_item":
            if not item_name:
                return "No item name specified."
            new_item = ItemModel(name=item_name.capitalize())
            if space_name:
                matched_spaces = match_spaces(space_name)
                if len(matched_spaces) == 1:
                    new_item.space_id = matched_spaces[0].id
                elif len(matched_spaces) > 1:
                    return f"Multiple spaces named '{space_name}'. Please specify which one."
                else:
                    return f"No space found named '{space_name}'."
            db.add(new_item)
            await db.commit()
            return f"Item '{new_item.name}' created."

        elif action == "create_space":
            if not space_name:
                return "No space name specified."
            new_space = SpaceModel(name=space_name.capitalize())
            db.add(new_space)
            await db.commit()
            return f"Space '{new_space.name}' created."

        elif action == "unknown":
            return "I'm not sure how to interpret that command. Could you rephrase it?"

        else:
            return f"Unsupported action: {action}"
    except Exception as e:
        print(f"[Error] {str(e)}")
        return f"An error occurred: {str(e)}"
