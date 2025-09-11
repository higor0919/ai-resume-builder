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
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')

# Enable CORS for all routes
CORS(app)

# Configure database path for Render deployment
# Use /tmp directory which is writable in Render environment
def is_render_environment():
    """Check if we're running in a Render environment"""
    # Check multiple possible environment variables
    render_indicators = [
        os.environ.get('RENDER'),
        os.environ.get('RENDER_SERVICE_NAME'),
        os.environ.get('RENDER_EXTERNAL_URL'),
        os.environ.get('PYTHONPATH', '').find('render') != -1
    ]
    return any(indicator for indicator in render_indicators if indicator)

# Print all environment variables for debugging (excluding sensitive ones)
print("=== ENVIRONMENT DEBUGGING ===")
print("Environment variables:")
for key, value in os.environ.items():
    if 'KEY' not in key and 'SECRET' not in key and 'PASSWORD' not in key:
        print(f"  {key}: {value}")

# Check if we should skip database initialization
skip_database = is_render_environment()
print(f"Skip database initialization: {skip_database}")
print("=== END ENVIRONMENT DEBUGGING ===")

# Always register the AI blueprint since it doesn't depend on the database
print("Registering AI blueprint...")
from src.routes.ai import ai_bp
app.register_blueprint(ai_bp, url_prefix='/api')
print("AI blueprint registered successfully")

# Database initialization - only if not on Render
# This is the critical section - we need to make sure no database code runs on Render
if not skip_database:
    print("=== INITIALIZING DATABASE (NOT ON RENDER) ===")
    try:
        # DEFENSIVE APPROACH: Only import database modules inside this block
        print("Importing database modules...")
        
        # Import the database instance
        print("Importing SQLAlchemy instance...")
        from src.models.user import db as database_instance
        print("SQLAlchemy instance imported successfully")
        
        # Import user routes (which also imports the database)
        print("Importing user routes...")
        from src.routes.user import user_bp
        print("User routes imported successfully")
        
        # Configure database URI for local development
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        print(f"Database URI configured: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Initialize database
        print("Initializing database app...")
        database_instance.init_app(app)
        print("Database app initialized successfully")
        
        # Register the user blueprint
        print("Registering user blueprint...")
        app.register_blueprint(user_bp, url_prefix='/api')
        print("User blueprint registered successfully")
        
        # Create tables with proper error handling
        def create_tables():
            print("Creating database tables...")
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
        print("Database initialization completed")
        
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
        # Continue without database - make it optional
        print("Continuing without database support...")
else:
    print("=== RUNNING ON RENDER - COMPLETELY SKIPPING ALL DATABASE CODE ===")
    print("All AI features will work without database")
    print("No database modules will be imported")
    print("No database initialization will occur")

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
    # Print current working directory for debugging
    print("=== APPLICATION STARTUP DEBUGGING ===")
    print(f"Current working directory: {os.getcwd()}")
    print(f"__file__ path: {__file__}")
    print(f"sys.path: {sys.path}")
    print("=== END APPLICATION STARTUP DEBUGGING ===")
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting application on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
    print("Application started successfully")