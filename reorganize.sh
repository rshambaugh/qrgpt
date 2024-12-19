#!/usr/bin/env bash

# Exit immediately on error
set -e

echo "Starting reorganization of the codebase..."

# Create the new recommended backend structure
# We’ll nest everything under backend/app to align with typical FastAPI project structure.

# 1. Create backend/app directories if they don't exist
mkdir -p backend/app/routes
mkdir -p backend/app/services
mkdir -p backend/app/utils

# Move main backend files into backend/app
# Assuming main.py, models.py, schemas.py currently in backend
if [ -f backend/main.py ]; then
    mv backend/main.py backend/app/main.py
fi
if [ -f backend/models.py ]; then
    mv backend/models.py backend/app/models.py
fi
if [ -f backend/schemas.py ]; then
    mv backend/schemas.py backend/app/schemas.py
fi

# Move routes into backend/app/routes
if [ -d backend/routes ]; then
    # Move route files if they exist
    if [ -f backend/routes/items.py ]; then
        mv backend/routes/items.py backend/app/routes/items.py
    fi
    if [ -f backend/routes/spaces.py ]; then
        mv backend/routes/spaces.py backend/app/routes/spaces.py
    fi
    # Remove old routes directory if empty
    rmdir backend/routes 2>/dev/null || true
fi

# Move services into backend/app/services
if [ -d backend/services ]; then
    # Move service files if they exist
    if [ -f backend/services/items.py ]; then
        mv backend/services/items.py backend/app/services/items.py
    fi
    if [ -f backend/services/spaces.py ]; then
        mv backend/services/spaces.py backend/app/services/spaces.py
    fi
    # Remove old services directory if empty
    rmdir backend/services 2>/dev/null || true
fi

# Move utils/db.py into backend/app/utils
if [ -f backend/utils/db.py ]; then
    mv backend/utils/db.py backend/app/utils/db.py
fi
# Remove old utils directory if empty
rmdir backend/utils 2>/dev/null || true

# Remove __pycache__ directories if they exist (optional cleanup)
find backend -type d -name "__pycache__" -exec rm -rf {} +

# After this, your backend structure should look like:
# backend/
#   app/
#     main.py
#     models.py
#     schemas.py
#     routes/
#       items.py
#       spaces.py
#     services/
#       items.py
#       spaces.py
#     utils/
#       db.py
#   requirements.txt
#   ... (other backend files)

echo "Backend reorganization complete."

# Frontend Reorganization
# The frontend already seems mostly in place, but we can ensure a clean structure:
# We'll ensure a services directory is used for API calls and a components directory for UI components.

# Ensure directories exist
mkdir -p frontend/src/services
mkdir -p frontend/src/components/forms
mkdir -p frontend/src/hooks
mkdir -p frontend/src/utils

# If api.js or apiClient.js, etc. are in frontend/src or a different location, move them to frontend/src/services.
if [ -f frontend/src/api.js ]; then
    mv frontend/src/api.js frontend/src/services/api.js
fi
if [ -f frontend/src/apiClient.js ]; then
    mv frontend/src/apiClient.js frontend/src/services/apiClient.js
fi
if [ -f frontend/src/utils.js ]; then
    mv frontend/src/utils.js frontend/src/services/utils.js
fi

# Move AddForm.js into frontend/src/components/forms/
if [ -f frontend/src/AddForm.js ]; then
    mv frontend/src/AddForm.js frontend/src/components/forms/AddForm.js
fi

# If there are other standalone components like ItemCard.js, SpaceList.js, etc.
# Move them into frontend/src/components/:
if [ -f frontend/src/ItemCard.js ]; then
    mv frontend/src/ItemCard.js frontend/src/components/ItemCard.js
fi
if [ -f frontend/src/SearchBar.js ]; then
    mv frontend/src/SearchBar.js frontend/src/components/SearchBar.js
fi
if [ -f frontend/src/SearchResults.js ]; then
    mv frontend/src/SearchResults.js frontend/src/components/SearchResults.js
fi
if [ -f frontend/src/ContainerDropZone.js ]; then
    mv frontend/src/ContainerDropZone.js frontend/src/components/ContainerDropZone.js
fi
if [ -f frontend/src/DragAndDropGrid.js ]; then
    mv frontend/src/DragAndDropGrid.js frontend/src/components/DragAndDropGrid.js
fi
if [ -f frontend/src/NestedSpaces.js ]; then
    mv frontend/src/NestedSpaces.js frontend/src/components/NestedSpaces.js
fi
if [ -f frontend/src/ParentContainer.js ]; then
    mv frontend/src/ParentContainer.js frontend/src/components/ParentContainer.js
fi
if [ -f frontend/src/SpaceList.js ]; then
    mv frontend/src/SpaceList.js frontend/src/components/SpaceList.js
fi
if [ -f frontend/src/Space.js ]; then
    mv frontend/src/Space.js frontend/src/components/Space.js
fi
if [ -f frontend/src/ItemList.js ]; then
    mv frontend/src/ItemList.js frontend/src/components/ItemList.js
fi
if [ -f frontend/src/Item.js ]; then
    mv frontend/src/Item.js frontend/src/components/Item.js
fi
if [ -f frontend/src/ContentArea.js ]; then
    mv frontend/src/ContentArea.js frontend/src/components/ContentArea.js
fi

# Move hooks and utilities:
if [ -f frontend/src/useFetchSpacesAndItems.js ]; then
    mv frontend/src/useFetchSpacesAndItems.js frontend/src/hooks/useFetchSpacesAndItems.js
fi

# Move styling and other stray files as needed:
if [ -f frontend/src/NestedSpaces.css ]; then
    mv frontend/src/NestedSpaces.css frontend/src/components/NestedSpaces.css
fi

# Remove src-structure.txt if it was just a reference
if [ -f frontend/src/src-structure.txt ]; then
    rm frontend/src/src-structure.txt
fi

echo "Frontend reorganization complete."

echo "Reorganization done. Please review the new structure, run the app, and proceed with the cleanup steps."

