export const capitalizeWords = (text) => {
    return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const generateIndentedOptions = (spaces) => {
    return spaces.map((space) => ({
      id: space.id,
      name: `${"\u00A0".repeat(space.depth * 4)}${space.name}`, // Indented name
    }));
  };
  