import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from flask import Flask, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

# Configure database path for Render deployment
# Use /tmp directory which is writable in Render environment
def is_render_environment():
    """Check if we're running in a Render environment"""
    render_env_vars = ['RENDER', 'RENDER_SERVICE_NAME', 'RENDER_EXTERNAL_URL']
    return any(os.environ.get(var) for var in render_env_vars)

# Print all environment variables for debugging (excluding sensitive ones)
print("Environment variables:")
for key, value in os.environ.items():
    if 'KEY' not in key and 'SECRET' not in key and 'PASSWORD' not in key:
        print(f"  {key}: {value}")

# Check if we should skip database initialization
skip_database = is_render_environment()
print(f"Skip database initialization: {skip_database}")

# Always register the AI blueprint since it doesn't depend on the database
from src.routes.ai import ai_bp
app.register_blueprint(ai_bp, url_prefix='/api')

if not skip_database:
    # Only import and initialize database if not on Render
    try:
        # Import database only if needed
        from src.models.user import db as database_instance
        from src.routes.user import user_bp
        
        # Configure database URI for local development
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Initialize database
        database_instance.init_app(app)
        
        # Register the user blueprint
        app.register_blueprint(user_bp, url_prefix='/api')
        
        # Create tables with proper error handling
        def create_tables():
            with app.app_context():
                try:
                    print("Attempting to create database tables...")
                    database_instance.create_all()
                    print("Database tables created successfully")
                except Exception as e:
                    print(f"Error creating database tables: {e}")
                    print(f"Database URI at time of error: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')}")
                    import traceback
                    traceback.print_exc()
        
        # Call create_tables after db is initialized
        create_tables()
        
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        # Continue without database - make it optional
        print("Continuing without database support...")
else:
    print("Running on Render - skipping database initialization for better compatibility")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)