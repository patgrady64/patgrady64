import csv
import io
import os
import traceback
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv

def get_supabase_columns():
    try:
        response = supabase.table("projects").select("*").limit(1).execute()
        if response.data:
            return set(response.data[0].keys())

        # fallback (prevents empty-table issue)
        return {
            "title",
            "description",
            "tech_stack",
            "architecture_tags",
            "project_type",
            "github_url",
            "live_url",
            "download_url",
            "gif_url",
            "screenshot_urls"
        }

    except Exception as e:
        print("Schema fetch failed:", e)
        return set()
        return set()

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

def safe_upload(file_key, folder, default_filename, project_title):
    if file_key not in request.files:
        return None

    file_obj = request.files[file_key]
    if not file_obj or file_obj.filename == "":
        return None

    return upload_asset(file_key, folder, default_filename, project_title)

def sanitize_for_supabase(data: dict):
    allowed = get_supabase_columns()
    return {k: v for k, v in data.items() if k in allowed}


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
        pipeline_state = {
            "files_uploaded": [],
            "db_written": False
        }
        if 'info_csv' not in request.files:
            return jsonify({"error": "Missing info.csv"}), 400

        # 1. Parse CSV
        project_data = parse_project_csv(request.files['info_csv'].read().decode('utf-8'))

        # 2. Extract and preserve filenames BEFORE cleaning
        binary_filename = project_data.get("binary_filename")
        gif_filename = project_data.get("gif_filename")
        screenshots = project_data.get("screenshots", [])

        # 3. Clean the project data for Supabase
        project_data.pop("screenshots", None)  # Don't need this in the DB row
        clean_project_data = sanitize_for_supabase(project_data)

        title = project_data.get('title', 'project')

        # 4. Upload Assets
        d_url = upload_asset('binary_filename', 'installers', binary_filename or 'app.apk', title)
        if d_url:
            pipeline_state["files_uploaded"].append(d_url)

        g_url = upload_asset('gif_filename', 'visuals', gif_filename or 'demo.gif', title)
        if g_url:
            pipeline_state["files_uploaded"].append(g_url)

        s_urls = []
        for shot in screenshots:
            if shot and shot in request.files:
                url = upload_asset(shot, 'screenshots', shot, title)
                if url:
                    pipeline_state["files_uploaded"].append(url)
                    s_urls.append(url)

        # 5. Sync to DB - Include the filenames here!
        supabase.table("projects").upsert({
            **clean_project_data,
            "binary_filename": binary_filename,  # Added
            "gif_filename": gif_filename,  # Added
            "download_url": d_url or "",
            "gif_url": g_url or "",
            "screenshot_urls": s_urls
        }, on_conflict="title").execute()

        pipeline_state["db_written"] = True
        return jsonify({"status": "success"}), 200

    except Exception as e:
        traceback.print_exc()
        # Rollback logic remains the same...
        if not pipeline_state["db_written"]:
            for url in pipeline_state["files_uploaded"]:
                try:
                    path = url.split("/storage/v1/object/public/portfolio-assets/")[-1]
                    supabase.storage.from_("portfolio-assets").remove([path])
                except Exception:
                    pass
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/check-assets/<project_title>', methods=['GET'])
def check_assets(project_title):
    try:
        # Construct paths for the folders where we store these assets
        folders = ['installers', 'visuals', 'screenshots']
        found_files = []

        for folder in folders:
            # List files in the project-specific subfolder
            path = f"{folder}/{secure_filename(project_title)}"
            response = supabase.storage.from_("portfolio-assets").list(path=path)

            # Extract filenames from the response
            if response:
                found_files.extend([f"{folder}/{file['name']}" for file in response])

        return jsonify({"files": found_files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/check-all-assets')
def check_all_assets():
    try:
        files = []

        folders = [
            "installers",
            "visuals",
            "screenshots"
        ]

        bucket = supabase.storage.from_("portfolio-assets")

        for root_folder in folders:

            # Get project folders (PicRoulette, Beacon, etc.)
            project_folders = bucket.list(root_folder)

            for project in project_folders:
                project_name = project["name"]

                # Go inside:
                # installers/PicRoulette
                path = f"{root_folder}/{project_name}"

                inner_files = bucket.list(path)

                for item in inner_files:
                    files.append({
                        "folder": root_folder,
                        "project": project_name,
                        "name": item["name"]
                    })

        return jsonify(files)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)