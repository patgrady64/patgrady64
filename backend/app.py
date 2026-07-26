import csv
import io
import os
import traceback
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client
from flask_cors import CORS
from dotenv import load_dotenv
import mimetypes

REQUIRED_FIELDS = {
    "Project": ["title", "description", "project_type", "tech_stack", "architecture_tags", "github_url", "screenshot_urls", "download_url", "gif_url", "dev_notes"],
    "YouTube": ["title", "game", "description", "video_date", "youtube_url"],
}

ALLOWED_COLUMNS = {
    "id",
    "type",
    "title",
    "description",
    "project_type",
    "tech_stack",
    "architecture_tags",
    "github_url",
    "live_url",
    "download_url",
    "gif_url",
    "screenshot_urls",
    "dev_notes",
    "video_date",
    "youtube_url",
    "game"
}

def check_integrity(item):
    item_type = item.get("type", "Project")
    requirements = REQUIRED_FIELDS.get(item_type, [])
    missing = []

    requirements = REQUIRED_FIELDS.get(item_type, [])

    for field in requirements:
        if not item.get(field):
            missing.append(field)

    if missing:
        return "Missing: " + ", ".join(missing)

    return "Ready"

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
            "screenshot_urls",
            "dev_notes"
        }

    except Exception as e:
        print("Schema fetch failed:", e)
        return set()

# 1. SETUP
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, methods=["GET", "POST", "DELETE", "OPTIONS"])

# 2. INITIALIZE CLIENT
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

sync_progress = {"status": "Idle", "percent": 0}

# 3. HELPER FUNCTIONS
def upload_asset(file_key, folder, filename, project_title):
    if file_key not in request.files:
        print(f"Missing file key: {file_key}")
        return None

    file_obj = request.files[file_key]
    file_obj.seek(0)

    path = f"{folder}/{secure_filename(project_title)}/{secure_filename(filename)}"

    try:
        supabase.storage.from_("portfolio-assets").upload(
            path=path,
            file=file_obj,
            file_options={"contentType": "application/octet-stream"}
        )
    except Exception as e:
        if '409' in str(e):
            print(f"Already exists: {filename}")
        else:
            print(f"Upload failed: {e}")
            return None

    return supabase.storage.from_("portfolio-assets").get_public_url(path)

def safe_upload(file_key, folder, default_filename, project_title):
    if file_key not in request.files:
        return None

    file_obj = request.files[file_key]
    if not file_obj or file_obj.filename == "":
        return None

    return upload_asset(file_key, folder, default_filename, project_title)


def sanitize_for_supabase(data: dict):
    # 1. First, filter only the allowed columns
    clean_data = {k: v for k, v in data.items() if k in ALLOWED_COLUMNS}

    # 2. Convert semicolon-delimited strings to Postgres Array format
    # This handles both 'tech_stack' and 'architecture_tags'


    return clean_data


# 4. API ROUTES
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        response = supabase.table("projects").select("*").execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# app.py

@app.route('/api/admin/sync', methods=['POST'])
def sync_dispatcher():
    print("FORM KEYS:", request.form.keys())
    print("FILES:", request.files.keys())
    print("🔥 HIT /api/admin/sync")

    try:
        # 1. Parse CSV content
        csv_text = request.form.get('manifest')
        print("MANIFEST LENGTH:", len(csv_text) if csv_text else None)
        if not csv_text:
            return jsonify({"error": "Missing manifest"}), 400
        # We need a quick way to get the 'type' without full parsing
        reader = csv.DictReader(io.StringIO(csv_text))
        first_row = next(reader, None)

        if not first_row:
            return jsonify({"error": "CSV is empty"}), 400

        item_type = first_row.get("type", "")
        item_type = item_type.encode("utf-8").decode("utf-8-sig").strip()

        print("RAW FIRST ROW:", first_row)
        print("RAW TYPE:", repr(item_type))

        if item_type == "Project":
            return handle_project_sync(first_row)
        elif item_type == "YouTube":
            return handle_youtube_sync(first_row)
        else:
            return jsonify({"error": f"Unknown type: {item_type}"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def handle_project_sync(data):
        try:
            # 0. Initialize Pipeline State
            update_status("Starting ingestion...", 0)

            # 1. Parse CSV
            update_status("Parsing manifest...", 10)

            manifest_data = {
                "title": data["title"],
                "type": data["type"],
                "binary_filename": data["binary_filename"],
                "gif_filename": data["gif_filename"],
                "screenshots": data["screenshots"]
            }

            title = manifest_data["title"]
            binary_file = manifest_data["binary_filename"]
            gif_file = manifest_data["gif_filename"]
            screenshots = [s.strip() for s in manifest_data["screenshots"].split(";") if s.strip()]
            manifest_data["screenshots"] = screenshots

            expected_files = set()
            if binary_file:
                expected_files.add(os.path.basename(binary_file))
            if gif_file:
                expected_files.add(os.path.basename(gif_file))
            expected_files.update(
                os.path.basename(s) for s in screenshots
            )

            # 2. Prepare Files for Upload Loop
            files = request.files.getlist("files")
            uploaded_files = {os.path.basename(file.filename) for file in files}
            print("EXPECTED FILES:", expected_files)
            print("UPLOADED FILES:", uploaded_files)
            is_valid, errors = validate_manifest(expected_files, uploaded_files)

            if not is_valid:
                return jsonify({
                    "error": "Manifest validation failed",
                    "details": errors
                }), 400

            # 3. Upload Loop with Progress Tracking
            urls = {"d_url": None, "g_url": None, "s_urls": []}

            screenshots = [os.path.basename(s) for s in screenshots]

            # 3. Upload Loop with Progress Tracking
            for file in files:
                filename = os.path.basename(file.filename)
                file.seek(0)

                # Binary match
                if filename == os.path.basename(binary_file):
                    url = upload_asset_manually(file, "installers", filename, title)
                    urls["d_url"] = url

                # GIF match
                elif filename == os.path.basename(gif_file):
                    url = upload_asset_manually(file, "demos", filename, title)
                    urls["g_url"] = url

                # Screenshot match
                elif filename in [os.path.basename(s) for s in screenshots]:
                    url = upload_asset_manually(file, "screenshots", filename, title)
                    urls["s_urls"].append(url)

                else:
                    print(f"⚠️ Unrecognized file ignored: {filename}")

            # 4. Sync to DB
            update_status("Finalizing database entry...", 80)

            # clean_project_data = sanitize_for_supabase(data)

            def to_array(value):
                if not value:
                    return []
                return [v.strip() for v in value.split(";") if v.strip()]

            clean_project_data = {
                "type": data["type"],
                "title": data["title"],
                "description": data["description"],
                "project_type": data["project_type"],
                "tech_stack": to_array(data.get("tech_stack")),
                "architecture_tags": to_array(data.get("architecture_tags")),
                "github_url": data["github_url"],
                "live_url": data.get("live_url", ""),
                "dev_notes": data["dev_notes"],
            }

            urls["s_urls"] = [u for u in urls["s_urls"] if u]

            print("UPSERT PAYLOAD:", {
                **clean_project_data,
                "download_url": urls["d_url"] or "",
                "gif_url": urls["g_url"] or "",
                "screenshot_urls": urls["s_urls"]
            })

            supabase.table("projects").upsert({
                **clean_project_data,
                "download_url": urls["d_url"] or "",
                "gif_url": urls["g_url"] or "",
                "screenshot_urls": urls["s_urls"]
            }, on_conflict="title").execute()

            update_status("Complete!", 100)
            return jsonify({"status": "success"}), 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            # Cleanup on failure
            return jsonify({"error": str(e)}), 500


def validate_manifest(expected_files, uploaded_files):
    missing = list(expected_files - uploaded_files)
    extra = list(uploaded_files - expected_files - {"info.csv"})

    errors = []

    if missing:
        errors.append(f"Missing files: {missing}")

    # optional strict mode (you can disable later)
    if extra:
        errors.append(f"Unexpected files: {extra}")

    if errors:
        return False, errors

    return True, None

import mimetypes


def upload_asset_manually(file_obj, folder, filename, project_title):
    # 1. Read the bytes from the FileStorage object
    file_bytes = file_obj.read()

    # 2. Detect the MIME type (as we discussed previously)
    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = 'application/octet-stream'

    path = f"{folder}/{secure_filename(project_title)}/{secure_filename(filename)}"

    # 3. Pass the bytes directly to the 'file' argument
    supabase.storage.from_("portfolio-assets").upload(
        path=path,
        file=file_bytes,  # <--- Pass the bytes, not the object
        file_options={"contentType": content_type}
    )

    return supabase.storage.from_("portfolio-assets").get_public_url(path)


def handle_youtube_sync(data):
    try:
        update_status("Processing YouTube metadata...", 50)

        # Sanitize data: Ensure date is in YYYY-MM-DD if needed
        # Note: If your Supabase column is strictly 'date',
        # ensure data.get('video_date') is a valid ISO string.

        supabase.table("youtube_videos").upsert({
            "title": data.get('title'),
            "game": data.get('game'),
            "description": data.get('description'),
            "video_date": data.get('video_date'),
            "youtube_url": data.get('youtube_url')
        }, on_conflict="title").execute()

        update_status("YouTube entry synchronized.", 100)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()  # Keep this for debugging!
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/check-assets/<project_title>', methods=['GET'])
def check_assets(project_title):
    try:
        # Construct paths for the folders where we store these assets
        folders = ['installers', 'demos', 'screenshots']
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
        projects = supabase.table("projects").select("*").execute().data
        bucket = supabase.storage.from_("portfolio-assets")
        folders = ["installers", "demos", "screenshots"]

        results = []
        for p in projects:
            # 1. Calculate Status
            status = check_integrity(p)

            # 2. Add Storage Integrity Check
            if status == "Ready":
                for folder in folders:
                    path = f"{folder}/{secure_filename(p.get('title', ''))}"
                    if not bucket.list(path=path):
                        status = f"Missing files in {folder}"
                        break

            # 3. Construct Unified Response
            results.append({
                "id": p.get("id"),
                "type": p.get("type", "Project"),
                "title": p.get("title"),
                "status": status,
                "metadata": {
                    "tech": p.get("tech_stack"),
                    "platform": p.get("platform"),
                    "isbn": p.get("isbn"),
                    "url": p.get("youtube_url")
                }
            })
        return jsonify(results)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/sync-status', methods=['GET'])
def get_sync_status():
    return jsonify(sync_progress)

def update_status(message, percent):
    sync_progress.update({"status": message, "percent": percent})


@app.route('/api/admin/delete/<id>', methods=['DELETE', 'OPTIONS'])
def delete_project(id):
    if request.method == 'OPTIONS':
        return '', 200  # Explicitly handle preflight

    try:
        # Reset progress tracker
        sync_progress.update({"status": "Deleting assets...", "percent": 25})

        # 1. Fetch the record
        response = supabase.table("projects").select("*").eq("id", id).single().execute()
        project = response.data
        if not project: return jsonify({"error": "Not found"}), 404

        sync_progress.update({"status": "Removing storage files...", "percent": 50})

        # 2. Identify and remove files
        project_title = secure_filename(project.get('title', ''))
        folders = ['installers', 'demos', 'screenshots']
        for folder in folders:
            path = f"{folder}/{project_title}"
            files = supabase.storage.from_("portfolio-assets").list(path=path)
            for file in files:
                supabase.storage.from_("portfolio-assets").remove([f"{path}/{file['name']}"])

        sync_progress.update({"status": "Cleaning database...", "percent": 75})

        # 3. Delete from DB
        supabase.table("projects").delete().eq("id", id).execute()

        sync_progress.update({"status": "Done", "percent": 100})
        return jsonify({"status": "success"}), 200
    except Exception as e:
        sync_progress.update({"status": "Error", "percent": 0})
        return jsonify({"error": str(e)}), 500

@app.route('/api/youtube', methods=['GET'])
def get_youtube_videos():
    # Fetch all records from the youtube_videos table
    response = supabase.table("youtube_videos").select("*").execute()
    return jsonify(response.data)

@app.route('/api/admin/registry', methods=['GET'])
def get_registry():
    try:
        projects = supabase.table("projects").select("*").execute().data
        youtube = supabase.table("youtube_videos").select("*").execute().data

        unified = []

        # Projects
        for p in projects:
            unified.append({
                "id": p["id"],
                "type": "Project",
                "title": p.get("title"),
                "created_at": p.get("created_at"),
                "metadata": {
                    "tech": p.get("tech_stack")
                }
            })

        # YouTube
        for v in youtube:
            unified.append({
                "id": v["id"],
                "type": "YouTube",
                "game": v["game"],
                "title": v.get("title"),
                "created_at": v.get("created_at"),
                "metadata": {
                    "url": v.get("youtube_url")
                }
            })

        # Sort newest first
        unified.sort(
            key=lambda x: x.get("created_at") or "",
            reverse=True
        )

        return jsonify(unified)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)