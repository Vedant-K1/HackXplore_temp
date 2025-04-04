from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

class Config():
    # app configuration
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # sqlalchemy configurations
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'

    # client session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    SESSION_PERMANENT = True
    SESSION_COOKIE_NAME = 'user_session'
    
    # BY ME DHRUVIL
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True # Good practice, usually True by default
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_DOMAIN = None
     