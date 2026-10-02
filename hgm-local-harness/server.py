import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Define and enforce the secure local sandbox boundary
WORKSPACE_DIR = os.path.abspath("./workspace")
os.makedirs(WORKSPACE_DIR, exist_ok=True)

def is_safe_path(target_path):
    """Security constraint: Prevent directory traversal (e.g., '../../Windows/System32')"""
    abs_target = os.path.abspath(target_path)
    return os.path.commonprefix([WORKSPACE_DIR, abs_target]) == WORKSPACE_DIR

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "substrate": "local-python-gateway",
        "workspace_boundary": WORKSPACE_DIR
    })

@app.route("/api/workspace/files", methods=["GET"])
def list_files():
    try:
        files = os.listdir(WORKSPACE_DIR)
        return jsonify({"status": "success", "files": files})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/workspace/read", methods=["POST"])
def read_file():
    data = request.json
    filename = data.get("filename")

    if not filename:
        return jsonify({"status": "error", "message": "Filename parameter is required."}), 400

    filepath = os.path.join(WORKSPACE_DIR, filename)

    if not is_safe_path(filepath):
        return jsonify({"status": "error", "message": "Security Fault: Path outside workspace boundary."}), 403

    if not os.path.exists(filepath):
        return jsonify({"status": "error", "message": f"File '{filename}' not found in workspace."}), 404

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({"status": "success", "filename": filename, "content": content})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/workspace/write", methods=["POST"])
def write_file():
    data = request.json
    filename = data.get("filename")
    content = data.get("content")

    if not filename or content is None:
        return jsonify({"status": "error", "message": "Filename and content parameters are required."}), 400

    filepath = os.path.join(WORKSPACE_DIR, filename)

    if not is_safe_path(filepath):
        return jsonify({"status": "error", "message": "Security Fault: Path outside workspace boundary."}), 403

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return jsonify({"status": "success", "message": f"File '{filename}' successfully written to workspace."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Placeholder for future MarTech tools (e.g., Pandas data processing, ML scoring)
@app.route("/api/tools/process-data", methods=["POST"])
def process_data():
    """Endpoint for Node.js harness to offload heavy Python tasks"""
    data = request.json
    # Implement Python-specific logic here
    return jsonify({"status": "success", "message": "Data processing complete", "result": {}})


if __name__ == "__main__":
    print(f"\n[SYSTEM ONLINE] Local Python Gateway running on http://localhost:5000")
    print(f"[SECURITY BOUNDARY] Sandboxed to: {WORKSPACE_DIR}\n")
    # use_reloader=False prevents Flask from running twice in some Windows terminal environments
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)