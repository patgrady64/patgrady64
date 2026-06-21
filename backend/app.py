import csv
import io
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv

# 1. IMMEDIATE ENV LOAD (With explicit path safety)
# This forces python-dotenv to find the .env file sitting right next to app.py
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)

# Enable CORS so your React frontend can fetch data securely
CORS(app)

# 2. HELPER FUNCTIONS (Defined before routes use them)
def parse_project_csv(csv_text_content):
    """
    Parses raw CSV string content from a multipart file stream
    and returns a clean, structured dictionary of project metadata.
    """
    csv_file = io.StringIO(csv_text_content)
    reader = csv.DictReader(csv_file)
    for row in reader:
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k}
        if 'tech_stack' in clean_row:
            clean_row['tech_stack'] = [tech.strip() for tech in clean_row['tech_stack'].split(';') if tech.strip()]
        return clean_row
    return None

# 3. INITIALIZE CLIENT
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Safety check print statements to help us debug in the terminal
print(f"--- DEBUG TELEMETRY ---")
print(f"Supabase URL Loaded: {SUPABASE_URL}")
print(f"Supabase Key Loaded: {'Successfully Found Key!' if SUPABASE_KEY else 'MISSING/EMPTY'}")
print(f"-----------------------")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 4. API ROUTE DECLARATIONS
@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "healthy", "message": "Portfolio API Engine running smoothly."})


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        # Fetch all columns for all projects from your live Supabase table
        response = supabase.table("projects").select("*").execute()

        # response.data contains the list of row dictionaries returned by Supabase
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch live database records: {str(e)}"}), 500

@app.route('/api/youtube', methods=['GET'])
def get_youtube_videos():
    return jsonify({"message": "YouTube sync endpoint ready."})

@app.route('/api/twitch', methods=['GET'])
def get_twitch_status():
    return jsonify({"is_live": False, "message": "Twitch sync endpoint ready."})


@app.route('/api/admin/sync-project', methods=['POST'])
def sync_project_pipeline():
    try:
        if 'info_csv' not in request.files:
            return jsonify({"error": "Missing mandatory info.csv execution file"}), 400

        csv_file = request.files['info_csv']
        csv_text = csv_file.read().decode('utf-8')

        project_data = parse_project_csv(csv_text)
        if not project_data:
            return jsonify({"error": "Failed to parse metadata or CSV format is empty"}), 400

        title = project_data.get('title')
        project_type = project_data.get('project_type', 'web')
        binary_filename = project_data.get('binary_filename')
        gif_filename = project_data.get('gif_filename')
        screenshot_filenames = project_data.get('screenshots', [])

        download_url = None
        gif_url = None
        screenshot_urls = []

        # 1. Pipeline Stream for Binary Application File (.apk / .zip)
        if binary_filename and binary_filename in request.files:
            asset_file = request.files[binary_filename]
            file_bytes = asset_file.read()
            bucket_path = f"installers/{secure_filename(title)}/{secure_filename(binary_filename)}"

            supabase.storage.from_("portfolio-assets").upload(
                path=bucket_path, file=file_bytes,
                file_options={"content-type": "application/octet-stream", "upsert": "true"}
            )
            download_url = supabase.storage.from_("portfolio-assets").get_public_url(bucket_path)

        # 2. Pipeline Stream for Animated Hero Graphic (.gif)
        if gif_filename and gif_filename in request.files:
            gif_file = request.files[gif_filename]
            gif_bytes = gif_file.read()
            bucket_path = f"visuals/{secure_filename(title)}/{secure_filename(gif_filename)}"

            supabase.storage.from_("portfolio-assets").upload(
                path=bucket_path, file=gif_bytes,
                file_options={"content-type": "image/gif", "upsert": "true"}
            )
            gif_url = supabase.storage.from_("portfolio-assets").get_public_url(bucket_path)

        # 3. Loop and Upload Multiple Screenshots
        for shot_name in screenshot_filenames:
            if shot_name in request.files:
                shot_file = request.files[shot_name]
                shot_bytes = shot_file.read()
                # Store inside a dedicated screenshots folder inside your bucket
                bucket_path = f"screenshots/{secure_filename(title)}/{secure_filename(shot_name)}"

                supabase.storage.from_("portfolio-assets").upload(
                    path=bucket_path, file=shot_bytes,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
                public_url = supabase.storage.from_("portfolio-assets").get_public_url(bucket_path)
                screenshot_urls.append(public_url)

        # 4. Consolidate into DB Payload Matching Your Expanded Schema
        db_payload = {
            "title": title,
            "project_type": project_type,
            "description": project_data.get('description'),
            "tech_stack": project_data.get('tech_stack', []),
            "architecture_tags": project_data.get('architecture_tags', []),
            "github_url": project_data.get('github_url'),
            "live_url": project_data.get('live_url'),
            "developer_notes": project_data.get('developer_notes'),
            "download_url": download_url if download_url else project_data.get('download_url'),
            "gif_url": gif_url if gif_url else project_data.get('gif_url'),
            "screenshot_urls": screenshot_urls if screenshot_urls else project_data.get('screenshot_urls', [])
        }

        supabase.table("projects").upsert(db_payload, on_conflict="title").execute()

        return jsonify({
            "status": "success",
            "message": f"Successfully synchronized project components for: {title}",
            "payload": db_payload
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal pipeline execution error: {str(e)}"}), 500

# 5. SERVER START (Keep at the absolute bottom)
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)