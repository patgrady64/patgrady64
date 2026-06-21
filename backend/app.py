import csv
import io
import os
import traceback
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv

# 1. SETUP
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
CORS(app)

# 2. INITIALIZE CLIENT
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# 3. HELPER FUNCTIONS
def parse_project_csv(csv_text_content):
    csv_file = io.StringIO(csv_text_content)
    reader = csv.DictReader(csv_file)
    for row in reader:
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k and v}
        clean_row['tech_stack'] = [t.strip() for t in clean_row.get('tech_stack', '').split(';') if t.strip()]
        clean_row['architecture_tags'] = [t.strip() for t in clean_row.get('architecture_tags', '').split(';') if
                                          t.strip()]
        clean_row['screenshots'] = [s.strip() for s in clean_row.get('screenshots', '').split(';') if s.strip()]
        return clean_row
    return None


def upload_asset(file_key, folder, filename, project_title):
    if file_key in request.files:
        file_obj = request.files[file_key]
        file_obj.seek(0)

        # Use the passed project_title here
        path = f"{folder}/{secure_filename(project_title)}/{secure_filename(filename)}"

        try:
            supabase.storage.from_("portfolio-assets").upload(
                path=path,
                file=file_obj.read(),
                file_options={"contentType": "application/octet-stream"}
            )
        except Exception as e:
            if '409' in str(e):
                print(f"INFO: {filename} already exists, skipping upload.")
            else:
                print(f"PIPELINE ERROR: Upload failed for {path}: {e}")
                return None

        return supabase.storage.from_("portfolio-assets").get_public_url(path)
    return None


# 4. API ROUTES
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        response = supabase.table("projects").select("*").execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/sync-project', methods=['POST'])
def sync_project_pipeline():
    try:
        if 'info_csv' not in request.files:
            return jsonify({"error": "Missing info.csv"}), 400

        project_data = parse_project_csv(request.files['info_csv'].read().decode('utf-8'))
        if not project_data:
            return jsonify({"error": "Failed to parse CSV"}), 400

        title = project_data.get('title', 'project')

        ALLOWED_PROJECT_FIELDS = {
            "title",
            "description",
            "tech_stack",
            "architecture_tags",
            "project_type",
            "github_url",
            "live_url"
        }

        clean_project_data = {
            k: v for k, v in project_data.items()
            if k in ALLOWED_PROJECT_FIELDS
        }

        # Upload Assets
        d_url = upload_asset('binary_filename', 'installers', project_data.get('binary_filename', 'app.apk'), title)
        g_url = upload_asset('gif_filename', 'visuals', project_data.get('gif_filename', 'demo.gif'), title)

        s_urls = []
        for shot in project_data.get('screenshots', []):
            if shot in request.files:
                url = upload_asset(shot, 'screenshots', shot, title)
                if url: s_urls.append(url)

        # Sync to DB
        supabase.table("projects").upsert({
            **clean_project_data,
            "download_url": d_url or "",
            "gif_url": g_url or "",
            "screenshot_urls": s_urls
        }, on_conflict="title").execute()

        return jsonify({"status": "success"}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)