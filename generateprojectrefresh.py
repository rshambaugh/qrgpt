import os
import zipfile
import json

# Define project structure and descriptions
project_description = {
    "frontend": "Contains the React frontend application.",
    "backend": "Contains the Flask backend application.",
}

# Locations and files to exclude
EXCLUDE_DIRS = [
    "frontend/node_modules",
    "backend/node_modules",
    "backend/qrganizer_env",
    "backend/services/__pycache__",
    "frontend/build",
    "frontend/.storybook",
    "frontend/src/stories",
    "backend/test_folder",
]
EXCLUDE_FILES = [
    "frontend/src/App2.js",
    "backend/main2.py",
    "frontend/qrcodefix.py",
    "frontend/audit-report.json",
    "frontend/package-lock.json",
    "frontend/axiostest.js",
    "frontend/src-tree.txt",
    "frontend/README.md",
    "frontend/.gitignore",
    "frontend/yarn.lock",
    "backend/.env",
    "backend/.env.production",
]

# Function to check if a path should be excluded
def should_exclude(path, root):
    relative_path = os.path.relpath(path, root)
    # Exclude directories and their subdirectories
    if any(relative_path.startswith(d) for d in EXCLUDE_DIRS):
        return True
    # Exclude specific files
    return relative_path in EXCLUDE_FILES

# Function to add files to the zip
def add_to_zip(directory, zip_file, root=""):
    for dirpath, dirnames, filenames in os.walk(directory):
        # Remove excluded directories from traversal
        dirnames[:] = [d for d in dirnames if not should_exclude(os.path.join(dirpath, d), root)]
        
        for file in filenames:
            file_path = os.path.join(dirpath, file)
            if should_exclude(file_path, root):
                print(f"Skipping {file_path}...")
                continue
            relative_path = os.path.relpath(file_path, root)
            zip_file.write(file_path, relative_path)
            print(f"Added {relative_path} to the zip file.")

# Function to generate a directory tree structure
def generate_directory_tree(root_dir, output_file="project_tree.txt"):
    tree_lines = []

    for root, dirs, files in os.walk(root_dir):
        # Exclude directories from the tree
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), root_dir)]
        level = root.replace(root_dir, "").count(os.sep)
        indent = " " * 4 * level
        tree_lines.append(f"{indent}{os.path.basename(root)}/")
        sub_indent = " " * 4 * (level + 1)
        for file in files:
            if not should_exclude(os.path.join(root, file), root_dir):
                tree_lines.append(f"{sub_indent}{file}")

    with open(output_file, "w") as f:
        f.write("\n".join(tree_lines))
    print(f"Directory tree saved to {output_file}")
    return output_file

# Main function to generate directory tree and create zip
def create_project_snapshot(output_zip="project_snapshot.zip"):
    project_root = os.getcwd()
    frontend_path = os.path.join(project_root, "frontend")
    backend_path = os.path.join(project_root, "backend")

    print("Creating project snapshot...")
    # Create a zip file
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Add frontend files
        if os.path.exists(frontend_path):
            print("Adding frontend files...")
            add_to_zip(frontend_path, zip_file, root=project_root)
        else:
            print("Frontend folder not found. Skipping...")

        # Add backend files
        if os.path.exists(backend_path):
            print("Adding backend files...")
            add_to_zip(backend_path, zip_file, root=project_root)
        else:
            print("Backend folder not found. Skipping...")

        # Generate and include directory tree
        print("Generating directory tree...")
        tree_file = generate_directory_tree(project_root, output_file="project_tree.txt")
        zip_file.write(tree_file, os.path.relpath(tree_file, project_root))
        os.remove(tree_file)  # Clean up after adding to the zip

        # Add project description as a JSON file
        print("Adding project description...")
        description_file = os.path.join(project_root, "project_description.json")
        with open(description_file, "w") as f:
            json.dump(project_description, f, indent=4)
        zip_file.write(description_file, os.path.relpath(description_file, project_root))
        os.remove(description_file)  # Clean up after adding to the zip

    print(f"Snapshot created successfully: {output_zip}")

if __name__ == "__main__":
    create_project_snapshot()
