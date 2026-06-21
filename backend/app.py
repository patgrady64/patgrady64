import os
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS so your React frontend can fetch data securely
CORS(app)

# Fallback sample data until you pull directly from your Supabase DB rows
SAMPLE_PROJECTS = [
    {
        "id": 1,
        "title": "PicRoulette",
        "description": "Dynamic photo management application.",
        "tech_stack": ["Kotlin", "Android Studio"],
        "gif_url": "",
        "apk_url": ""
    },
    {
        "id": 2,
        "title": "SinceWhen",
        "description": "Clean, milestone and time tracking application.",
        "tech_stack": ["Kotlin", "Android Studio"],
        "gif_url": "",
        "apk_url": ""
    }
]

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "healthy", "message": "Portfolio API Engine running smoothly."})

@app.route('/api/projects', methods=['GET'])
def get_projects():
    # Later, you will swap this out with your Supabase table query
    return jsonify(SAMPLE_PROJECTS)

@app.route('/api/youtube', methods=['GET'])
def get_youtube_videos():
    return jsonify({"message": "YouTube sync endpoint ready."})

@app.route('/api/twitch', methods=['GET'])
def get_twitch_status():
    return jsonify({"is_live": False, "message": "Twitch sync endpoint ready."})

if __name__ == '__main__':
    # Grab port from environment for hosting environments, fallback to 5000 locally
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)