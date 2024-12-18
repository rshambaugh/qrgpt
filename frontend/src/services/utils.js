export const capitalizeWords = (text) => {
    return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const generateIndentedOptions = (spaces, parentId = null, depth = 0) => {
  const results = [];

  // Filter spaces by parent_id to build hierarchy
  spaces
    .filter((space) => space.parent_id === parentId)
    .forEach((space) => {
      // Push the current space with proper indentation
      results.push({
        id: space.id,
        name: `${"\u00A0".repeat(depth * 4)}${space.name}`, // Indentation using non-breaking spaces
      });

      // Recursively process child spaces
      results.push(...generateIndentedOptions(spaces, space.id, depth + 1));
    });

  return results;
};
