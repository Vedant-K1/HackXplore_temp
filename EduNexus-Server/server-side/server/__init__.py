from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from server.config import Config
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
from datetime import timedelta
from flask import request, session, jsonify, send_file, Blueprint

db = SQLAlchemy()
bcrypt = Bcrypt()
socketio = SocketIO(cors_allowed_origins="http://localhost:5173")

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)
    print(f"SECRET_KEY Check: {app.config.get('SECRET_KEY')}") 
    # Important flask session configuration
    
    
    # app.config['SESSION_COOKIE_SECURE'] = False  # Set to True only if using HTTPS
    # app.config['SESSION_COOKIE_HTTPONLY'] = True
    # app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Try 'None' if this doesn't work
    # app.config['SESSION_COOKIE_DOMAIN'] = None  # Remove domain restriction
    # app.config['SESSION_PERMANENT'] = True
    
    
    # app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)  # Session duration
    # app.secret_key = 'make-this-a-strong-secret-key'  # Very important!

    # Make sessions permanent by default
    # @app.before_request
    # def make_session_permanent():
    #     session.permanent = True
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Origin'] = REACT_APP_ORIGIN
        return response
    app.json.sort_keys = False
    # CORS(app, supports_credentials=True)
    REACT_APP_ORIGIN = "http://localhost:5173"
    CORS( app,
    origins=[REACT_APP_ORIGIN], # Exact origin
    supports_credentials=True, # <--- THIS IS CRITICAL for cookies
     allow_headers=[
            "Content-Type", 
            "Authorization", 
            "X-Requested-With", 
            "Accept", 
            "Origin"
        ],
        expose_headers=["Content-Type", "Authorization","Set-Cookie"], # Add others if needed
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
    with app.app_context(): # Ensure we are in app context for session
        # Inside create_app() in server/__init__.py, alongside the test-session-set route

        @app.route('/test-session-read', methods=['GET'])
        def test_session_read():
            print("--- Accessing /test-session-read ---")
            user_id = session.get('user_id', '--- NOT FOUND ---')
            session_data = dict(session)
            print(f"Session data on READ: {session_data}")
            # Log incoming cookies specifically for this request
            print(f"Cookies received by /test-session-read: {request.cookies}")
            if 'user_session' in request.cookies:
                 print(">>> user_session cookie WAS received by Flask!")
            else:
                 print(">>> user_session cookie WAS NOT received by Flask!")

            return jsonify({"user_id_from_session": user_id, "full_session": session_data})

        @app.route('/test-session-set', methods=['GET'])
        def test_session_set():
            print("--- Accessing /test-session-set ---")
            session['test_data'] = 'hello world'
            session.modified = True
            session.permanent = True # Mimic login settings
            print(f"Test Session Data: {dict(session)}")
            print(f"Test Session Modified: {session.modified}")

            # Check if Flask intends to set the cookie
            should_set = app.session_interface.should_set_cookie(app, session)
            print(f"Test: Flask thinks it should set cookie: {should_set}")

            response = jsonify({"message": "Test session set, check headers"})
            print(f"Test Response Headers before return: {response.headers}")
            return response

        @app.route('/test-session-get', methods=['GET'])
        def test_session_get():
            print("--- Accessing /test-session-get ---")
            user_id = session.get('user_id', 'Not Set')
            test_data = session.get('test_data', 'Not Set')
            print(f"Session data on GET: {dict(session)}")
            return jsonify({"user_id": user_id, "test_data": test_data})

    return app
