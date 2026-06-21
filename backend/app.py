import csv
import io
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv
import traceback

# 1. SETUP
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
CORS(app)

# 2. INITIALIZE CLIENT
SUPABASE_URL = os.environ.get("SUPABASE_URL")

print("SUPABASE_URL =", SUPABASE_URL)
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("DEBUG: Testing Supabase connection...")
    supabase.table("projects").select("title").limit(1).execute()
    print("DEBUG: Supabase connection successful!")
except Exception as e:
    print(f"DEBUG: Supabase CONNECTION FAILED: {e}")


# 3. HELPER FUNCTIONS
def parse_project_csv(csv_text_content):
    csv_file = io.StringIO(csv_text_content)
    reader = csv.DictReader(csv_file)
    for row in reader:
        # Strip whitespace from keys/values
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k and v}

        # Parse Lists
        clean_row['tech_stack'] = [t.strip() for t in clean_row.get('tech_stack', '').split(';') if t.strip()]
        clean_row['architecture_tags'] = [t.strip() for t in clean_row.get('architecture_tags', '').split(';') if
                                          t.strip()]
        clean_row['screenshots'] = [s.strip() for s in clean_row.get('screenshots', '').split(';') if s.strip()]

        return clean_row
    return None


# 4. API ROUTES

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "API is online"}), 200


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        response = supabase.table("projects").select("*").execute()
        return jsonify(response.data), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500


@app.route('/api/admin/sync-project', methods=['POST'])
def sync_project_pipeline():
    try:
        if 'info_csv' not in request.files:
            return jsonify({"error": "Missing info.csv"}), 400

        project_data = parse_project_csv(request.files['info_csv'].read().decode('utf-8'))
        if not project_data:
            return jsonify({"error": "Failed to parse CSV"}), 400

        title = secure_filename(project_data.get('title', 'project'))

        def upload_asset(file_key, folder, filename):
            if file_key in request.files:
                file_obj = request.files[file_key]
                file_obj.seek(0)  # Ensure we are at the start of the file

                # Use secure_filename to create a valid path
                path = f"{folder}/{secure_filename(title)}/{secure_filename(filename)}"

                try:
                    # 1. Attempt Upload
                    supabase.storage.from_("portfolio-assets").upload(
                        path=path,
                        file=file_obj.read(),
                        file_options={"content-type": "application/octet-stream"}
                    )
                    print(f"SUCCESS: Uploaded {path}")
                except Exception as e:
                    # 2. Check for Duplicate (409)
                    if '409' in str(e):
                        print(f"INFO: {filename} already exists. Skipping upload.")
                    else:
                        print(f"PIPELINE ERROR: Unexpected error for {path}: {e}")
                        return None

                # 3. Always fetch and return the URL
                return supabase.storage.from_("portfolio-assets").get_public_url(path)
            return None

        # UPDATE THIS BLOCK (Correcting the arguments)
        d_url = upload_asset('binary_filename', 'installers', project_data.get('binary_filename'))
        g_url = upload_asset('gif_filename', 'visuals', project_data.get('gif_filename'))

        s_urls = []
        for shot in project_data.get('screenshots', []):
            url = upload_asset(shot, 'screenshots', shot)
            if url: s_urls.append(url)

        # Upload Binary and GIF
        d_url = upload_asset(
            project_data.get('binary_filename'), 'installers', project_data.get('binary_filename', 'app.apk'))
        g_url = upload_asset(
            project_data.get('gif_filename'), 'visuals', project_data.get('gif_filename', 'demo.gif'))

        # Process Screenshots using keys from request.files
        s_urls = []
        for shot_filename in project_data.get('screenshots', []):
            if shot_filename in request.files:
                url = upload_asset(shot_filename, 'screenshots', shot_filename)
                if url: s_urls.append(url)

        # Sync to DB
        supabase.table("projects").upsert({
            **project_data,
            "download_url": d_url,
            "gif_url": g_url,
            "screenshot_urls": s_urls
        }, on_conflict="title").execute()

        return jsonify({"status": "success", "message": "Pipeline complete"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)