import os
from flask_sqlalchemy import SQLAlchemy

# Only create the database instance if we're not on Render
def create_db_instance():
    # Check if we're in a Render environment
    render_indicators = [
        os.environ.get('RENDER'),
        os.environ.get('RENDER_SERVICE_NAME'),
        os.environ.get('RENDER_EXTERNAL_URL'),
        os.environ.get('PYTHONPATH', '').find('render') != -1
    ]
    is_render = any(indicator for indicator in render_indicators if indicator)
    
    if is_render:
        # Return None or a mock object for Render environment
        print("=== RENDER ENVIRONMENT DETECTED - NOT CREATING DATABASE INSTANCE ===")
        return None
    
    print("=== CREATING DATABASE INSTANCE (NOT ON RENDER) ===")
    return SQLAlchemy()

# Try to create the database instance
try:
    db = create_db_instance()
except Exception as e:
    print(f"Error creating database instance: {e}")
    db = None

class User(db.Model if db else object):
    if db:  # Only define columns if db exists
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(80), unique=True, nullable=False)
        email = db.Column(db.String(120), unique=True, nullable=False)

        def __repr__(self):
            return f'<User {self.username}>'

        def to_dict(self):
            return {
                'id': self.id,
                'username': self.username,
                'email': self.email
            }
    else:
        # Mock implementation for Render environment
        def __init__(self, *args, **kwargs):
            pass
        
        def to_dict(self):
            return {}