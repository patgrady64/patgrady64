import csv
import io


def parse_project_csv(csv_text_content):
    csv_file = io.StringIO(csv_text_content)
    reader = csv.DictReader(csv_file)
    for row in reader:
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k}

        # Parse arrays using the semicolon splitter
        if 'tech_stack' in clean_row:
            clean_row['tech_stack'] = [t.strip() for t in clean_row['tech_stack'].split(';') if t.strip()]
        if 'architecture_tags' in clean_row:
            clean_row['architecture_tags'] = [a.strip() for a in clean_row['architecture_tags'].split(';') if a.strip()]

        return clean_row
    return None