from flask import Blueprint, jsonify, request, current_app

user_bp = Blueprint('user', __name__)

# Import database only when needed, not at module level
def get_db():
    """Get database instance, but only if available"""
    # Check if database is disabled (e.g., on Render)
    if current_app.config.get('DATABASE_DISABLED', False):
        return None
    
    # Import database only when actually needed
    try:
        from src.models.user import db
        return db if db is not None else None
    except ImportError:
        return None

def get_user_model():
    """Get User model, but only if available"""
    # Check if database is disabled (e.g., on Render)
    if current_app.config.get('DATABASE_DISABLED', False):
        return None
    
    # Import User model only when actually needed
    try:
        from src.models.user import User
        # Check if User is properly initialized
        db = get_db()
        if db is None:
            return None
        return User
    except ImportError:
        return None

@user_bp.route('/users', methods=['GET'])
def get_users():
    db = get_db()
    User = get_user_model()
    
    # Return error if database is not available
    if db is None or User is None:
        return jsonify({'error': 'Database not available'}), 501
    
    try:
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@user_bp.route('/users', methods=['POST'])
def create_user():
    db = get_db()
    User = get_user_model()
    
    # Return error if database is not available
    if db is None or User is None:
        return jsonify({'error': 'Database not available'}), 501
    
    try:
        data = request.json
        user = User(username=data['username'], email=data['email'])
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db = get_db()
    User = get_user_model()
    
    # Return error if database is not available
    if db is None or User is None:
        return jsonify({'error': 'Database not available'}), 501
    
    try:
        user = User.query.get_or_404(user_id)
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    db = get_db()
    User = get_user_model()
    
    # Return error if database is not available
    if db is None or User is None:
        return jsonify({'error': 'Database not available'}), 501
    
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    db = get_db()
    User = get_user_model()
    
    # Return error if database is not available
    if db is None or User is None:
        return jsonify({'error': 'Database not available'}), 501
    
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return '', 204
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500