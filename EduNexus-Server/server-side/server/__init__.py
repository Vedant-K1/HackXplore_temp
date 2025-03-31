from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from server.config import Config
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
from datetime import timedelta

db = SQLAlchemy()
bcrypt = Bcrypt()
socketio = SocketIO(cors_allowed_origins="http://localhost:3000")

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)
    # Important flask session configuration
    app.config['SESSION_COOKIE_SECURE'] = False  # Set to True only if using HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Try 'None' if this doesn't work
    app.config['SESSION_COOKIE_DOMAIN'] = None  # Remove domain restriction
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)  # Session duration
    app.secret_key = 'make-this-a-strong-secret-key'  # Very important!

    # Make sessions permanent by default
    @app.before_request
    def make_session_permanent():
        session.permanent = True
    app.json.sort_keys = False
    # CORS(app, supports_credentials=True)
    REACT_APP_ORIGIN = "http://localhost:3000"
    CORS( app,
    origins=[REACT_APP_ORIGIN], # Exact origin
    supports_credentials=True, # <--- THIS IS CRITICAL for cookies
    allow_headers=["Content-Type"], # Add others if needed
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    

    db.init_app(app)
    bcrypt.init_app(app)
    socketio.init_app(app)
    migrate = Migrate(app, db)

    from server.teacher.routes_mongo import teachers
    from server.student.routes import students
    app.register_blueprint(teachers, url_prefix="/teacher")
    app.register_blueprint(students, url_prefix="/student")
    from . import socket_handlers

    return app
