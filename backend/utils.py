import csv
import io


def parse_project_csv(csv_text_content):
    """
    Parses raw CSV string content from a multipart file stream
    and returns a clean, structured dictionary of project metadata.
    """
    # Convert raw text string into an in-memory text stream file object
    csv_file = io.StringIO(csv_text_content)
    reader = csv.DictReader(csv_file)

    # Grab the first data row entry
    for row in reader:
        # Strip trailing white spaces from headers and values dynamically
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k}

        # Split semi-colon separated tech string into a real Python list array
        if 'tech_stack' in clean_row:
            clean_row['tech_stack'] = [tech.strip() for tech in clean_row['tech_stack'].split(';') if tech.strip()]

        return clean_row
    return None