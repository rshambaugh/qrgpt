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
"Move the garage under basement" (meaning move space under a parent space)
"Create a new space named 'Storage Room' inside 'Garage'"
etc.

Reply ONLY with valid JSON in this shape:
{{
  "action": "...",
  "item_name": "...",
  "space_name": "...",
  "extra_details": "..."
}}
Where 'action' is one of:
["create_item", "move_item", "delete_item", "find_item", "create_space", "move_space", "delete_space", "create_nested_space", "unknown"]

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
        return {
            "action": "unknown",
            "item_name": None,
            "space_name": None,
            "extra_details": content
        }

def fuzzy_match(target_name: str, all_names: list[str]) -> str | None:
    """
    Returns the single closest match if any, else None.
    """
    if not target_name:
        return None
    matches = get_close_matches(target_name, all_names, n=1, cutoff=0.6)
    return matches[0] if matches else None

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
        # Fetch items and spaces with joined load (and .unique() to avoid duplicates)
        result_items = await db.execute(
            select(ItemModel).options(joinedload(ItemModel.space))
        )
        items = result_items.unique().scalars().all()

        result_spaces = await db.execute(
            select(SpaceModel).options(joinedload(SpaceModel.items))
        )
        spaces = result_spaces.unique().scalars().all()

        item_names = [i.name.lower() for i in items]
        space_names = [s.name.lower() for s in spaces]

        # Helper: fuzzy or exact match for item
        async def get_item_obj(name: str, db: AsyncSession) -> Tuple[Optional[object], Optional[str]]:
            """
            Fetch an item by name using exact or fuzzy matching.
            Returns the item object and an optional error message.
            """
            if not name:
                return None, "No item name provided."

            try:
                # Query items with their associated space using joinedload
                result = await db.execute(
                    select(ItemModel)
                    .options(joinedload(ItemModel.space))
                )
                # Apply .unique() to eliminate duplicates
                items = result.unique().scalars().all()

                # Extract item names for fuzzy matching
                item_names = [i.name.lower() for i in items]

                # Exact Match
                exact_matches = [i for i in items if i.name.lower() == name.lower()]
                if len(exact_matches) == 1:
                    return exact_matches[0], None
                elif len(exact_matches) > 1:
                    return None, f"Multiple items named '{name}' found. Please specify more clearly."

                # Fuzzy Match
                best_guess = fuzzy_match(name, item_names)
                if best_guess:
                    matched = [i for i in items if i.name.lower() == best_guess]
                    if matched:
                        return matched[0], f"Assumed you meant '{best_guess}' for the item."

                return None, f"No item found matching '{name}'."

            except Exception as e:
                print(f"[get_item_obj] Error: {e}")
                return None, f"An error occurred while fetching the item: {str(e)}"



        # Helper: fuzzy or exact match for space
        async def get_space_obj(name: str, db: AsyncSession) -> Tuple[Optional[object], Optional[str]]:
            """
            Fetch a space by name using exact or fuzzy matching.
            Returns the space object and an optional error message.
            """
            if not name:
                return None, "No space name provided."

            try:
                # Query spaces with their associated items using joinedload
                result = await db.execute(
                    select(SpaceModel)
                    .options(joinedload(SpaceModel.items))
                )
                # Apply .unique() to eliminate duplicates
                spaces = result.unique().scalars().all()

                # Extract space names for fuzzy matching
                space_names = [s.name.lower() for s in spaces]

                # Exact Match
                exact_matches = [s for s in spaces if s.name.lower() == name.lower()]
                if len(exact_matches) == 1:
                    return exact_matches[0], None
                elif len(exact_matches) > 1:
                    return None, f"Multiple spaces named '{name}' found. Please specify more clearly."

                # Fuzzy Match
                best_guess = fuzzy_match(name, space_names)
                if best_guess:
                    matched = [s for s in spaces if s.name.lower() == best_guess]
                    if matched:
                        return matched[0], f"Assumed you meant '{best_guess}' for the space."

                return None, f"No space found matching '{name}'."

    except Exception as e:
        print(f"[get_space_obj] Error: {e}")
        return None, f"An error occurred while fetching the space: {str(e)}"


        if action == "create_item":
            if not item_name:
                return "No item name specified."

            new_item = ItemModel(name=item_name.capitalize())
            
            if space_name:
                space_obj, space_err = await get_space_obj(space_name, db)  # Properly awaited with db
                if space_err:
                    return space_err
                if space_obj:
                    new_item.space_id = space_obj.id

            db.add(new_item)
            try:
                await db.commit()
                return f"Item '{new_item.name}' created successfully."
            except Exception as e:
                await db.rollback()
                raise Exception(f"Failed to create item: {str(e)}")


        if action == "find_item":
            if not item_name:
                return "No item name specified for the search."

            # Await the async get_item_obj call and pass db explicitly
            item_obj, item_err = await get_item_obj(item_name, db)
            if item_err:
                return item_err

            if item_obj and item_obj.space:
                return f"Item '{item_obj.name}' is located in space '{item_obj.space.name}'."
            elif item_obj:
                return f"Item '{item_obj.name}' was found, but its location is unspecified."
            else:
                return f"No item named '{item_name}' was found."


        if action == "delete_item":
            if not item_name:
                return "No item name specified for deletion."

            item_obj, item_err = await get_item_obj(item_name, db)
            if item_err:
                return item_err

            try:
                await db.delete(item_obj)
                await db.commit()
                return f"Item '{item_obj.name}' deleted successfully."
            except Exception as e:
                await db.rollback()
                return f"Failed to delete item: {str(e)}"


        if action == "delete_space":
            if not space_name:
                return "No space name specified for deletion."

            space_obj, space_err = await get_space_obj(space_name, db)
            if space_err:
                return space_err

            try:
                await db.delete(space_obj)
                await db.commit()
                return f"Space '{space_obj.name}' deleted successfully."
            except Exception as e:
                await db.rollback()
                return f"Failed to delete space: {str(e)}"


        if action == "create_nested_space":
            if not space_name or not extra:
                return "Both space name and parent space name must be specified."

            # Fetch parent space
            parent_space, parent_err = await get_space_obj(extra, db)
            if parent_err:
                return parent_err

            # Create new nested space
            new_space = SpaceModel(name=space_name.capitalize(), parent_id=parent_space.id)
            
            try:
                db.add(new_space)
                await db.commit()
                return f"Space '{new_space.name}' created under '{parent_space.name}'."
            except Exception as e:
                await db.rollback()
                return f"Failed to create nested space: {str(e)}"


        return "Unsupported action."

    except Exception as e:
        print(f"[Error] {str(e)}")
        return f"An error occurred: {str(e)}"
