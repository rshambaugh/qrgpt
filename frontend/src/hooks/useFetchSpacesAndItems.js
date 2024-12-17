import { useState, useEffect } from "react";

const useFetchSpacesAndItems = () => {
  const [spaces, setSpaces] = useState([]);
  const [items, setItems] = useState([]);

  const fetchSpacesAndItems = async () => {
    try {
      const responseSpaces = await fetch("http://localhost:8000/spaces-recursive/");
      const responseItems = await fetch("http://localhost:8000/items/");

      if (!responseSpaces.ok) throw new Error(`Spaces fetch failed: ${responseSpaces.statusText}`);
      if (!responseItems.ok) throw new Error(`Items fetch failed: ${responseItems.statusText}`);

      const spacesData = await responseSpaces.json();
      const itemsData = await responseItems.json();

      setSpaces(spacesData.spaces || []);
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching spaces and items:", error);
    }
  };

  useEffect(() => {
    fetchSpacesAndItems();
  }, []);

  return { spaces, items, fetchSpacesAndItems };
};

export default useFetchSpacesAndItems;
