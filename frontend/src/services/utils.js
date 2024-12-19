export const capitalizeWords = (text) => {
    return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const generateIndentedOptions = (spaces, parentId = null, depth = 0) => {
  if (!Array.isArray(spaces)) return [];

  const results = [];

  spaces
    .filter((space) => space.parent_id === parentId)
    .forEach((space) => {
      results.push({
        id: space.id,
        name: `${"\u00A0".repeat(depth * 4)}${space.name}`,
      });

      results.push(...generateIndentedOptions(spaces, space.id, depth + 1));
    });

  return results;
};

