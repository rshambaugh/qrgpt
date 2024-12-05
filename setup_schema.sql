-- Connect to the qrdb database
\c qrdb;

-- Drop tables if they already exist
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS spaces;

-- Create the spaces table
CREATE TABLE spaces (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INT REFERENCES spaces(id) ON DELETE CASCADE
);

-- Create the items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    space_id INT REFERENCES spaces(id) ON DELETE SET NULL
);

-- Sample data for spaces
INSERT INTO spaces (name, parent_id) VALUES
('Home', NULL),
('Garage', 1),
('Closet', 1),
('Cabinet A', 2),
('Shelf 1', 4);

-- Sample data for items
INSERT INTO items (name, description, space_id) VALUES
('Hammer', 'A basic tool', 2),
('Drill', 'Cordless drill', 2),
('Sweater', 'Winter sweater', 3),
('Books', 'Stack of novels', 5),
('Laptop', 'Work laptop', NULL);
