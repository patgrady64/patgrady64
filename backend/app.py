import csv
import io
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv

# 1. IMMEDIATE ENV LOAD
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
CORS(app)


# 2. HELPER FUNCTIONS
def parse_project_csv(csv_text_content):
    csv_file = io.StringIO(csv_text_content)
    reader = csv.DictReader(csv_file)
    for row in reader:
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k and v}

        # Parse Lists
        clean_row['tech_stack'] = [t.strip() for t in clean_row.get('tech_stack', '').split(';') if t.strip()]
        clean_row['architecture_tags'] = [t.strip() for t in clean_row.get('architecture_tags', '').split(';') if
                                          t.strip()]
        clean_row['screenshots'] = [s.strip() for s in clean_row.get('screenshots', '').split(';') if s.strip()]

        return clean_row
    return None


# 3. INITIALIZE CLIENT
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# 4. API ROUTE
@app.route('/api/admin/sync-project', methods=['POST'])
def sync_project_pipeline():
    try:
        if 'info_csv' not in request.files:
            return jsonify({"error": "Missing info.csv"}), 400

        project_data = parse_project_csv(request.files['info_csv'].read().decode('utf-8'))
        if not project_data:
            return jsonify({"error": "Failed to parse CSV"}), 400

        title = project_data.get('title')

        # Helper to handle the "Force Delete -> Upload" pattern
        def upload_asset(file_key, folder, content_type):
            if file_key in request.files:
                file_obj = request.files[file_key]
                file_bytes = file_obj.read()
                path = f"{folder}/{secure_filename(title)}/{secure_filename(file_obj.filename)}"

                # Try to remove old file to avoid 400 error
                try:
                    supabase.storage.from_("portfolio-assets").remove([path])
                except Exception:
                    pass

                # Upload fresh
                supabase.storage.from_("portfolio-assets").upload(
                    path=path,
                    file=file_bytes,
                    file_options={"content-type": content_type}
                )
                return supabase.storage.from_("portfolio-assets").get_public_url(path)
            return None

        # Process Assets
        download_url = upload_asset('binary_filename', 'installers', 'application/octet-stream')
        gif_url = upload_asset('gif_filename', 'visuals', 'image/gif')

        screenshot_urls = []
        for shot in project_data.get('screenshots', []):
            url = upload_asset(shot, 'screenshots', 'image/png')
            if url: screenshot_urls.append(url)

        # Consolidate and Upsert
        db_payload = {
            "title": title,
            "project_type": project_data.get('project_type', 'web'),
            "description": project_data.get('description'),
            "tech_stack": project_data.get('tech_stack'),
            "architecture_tags": project_data.get('architecture_tags'),
            "github_url": project_data.get('github_url'),
            "live_url": project_data.get('live_url'),
            "download_url": download_url,
            "gif_url": gif_url,
            "screenshot_urls": screenshot_urls
        }

        # Committing to Database
        supabase.table("projects").upsert(db_payload, on_conflict="title").execute()

        return jsonify({"status": "success", "message": "Pipeline complete"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)