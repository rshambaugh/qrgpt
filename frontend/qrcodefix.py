def regenerate_all_qr_codes():
    """
    Regenerates and updates all QR codes for items and containers in the database.
    Ensures the QR codes have the correct format.
    """
    try:
        # Update QR codes for items
        cursor.execute("SELECT id, name, location, storage_container FROM items")
        items = cursor.fetchall()

        for item in items:
            item_id, name, location, storage_container = item
            qr_data = f"Item: {name}\nLocation: {location}\nContainer: {storage_container or 'None'}"
            qr_code_data = generate_qr_code(qr_data)
            cursor.execute("UPDATE items SET qr_code = %s WHERE id = %s", (qr_code_data, item_id))

        # Update QR codes for containers
        cursor.execute("SELECT id, name, location FROM containers")
        containers = cursor.fetchall()

        for container in containers:
            container_id, name, location = container
            qr_data = f"Container: {name}\nLocation: {location or 'N/A'}"
            qr_code_data = generate_qr_code(qr_data)
            cursor.execute("UPDATE containers SET qr_code = %s WHERE id = %s", (qr_code_data, container_id))

        # Commit changes
        conn.commit()
        print("QR codes successfully regenerated for all items and containers.")
    except Exception as e:
        conn.rollback()
        print(f"Error while regenerating QR codes: {e}")
