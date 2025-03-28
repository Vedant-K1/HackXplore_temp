from sqlalchemy.dialects.sqlite import JSON
from server import db, bcrypt
from datetime import datetime
from pytz import timezone
class Teacher(db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    college_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=True)
    experience = db.Column(db.Integer, nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    qualification = db.Column(db.String(200), nullable=True)
    subjects = db.Column(db.String(100), nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    gender = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    date_joined = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone("Asia/Kolkata")))

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    course_name = db.Column(db.String(200), nullable=False)
    num_of_lectures = db.Column(db.Integer, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    lessons_data = db.Column(JSON, nullable=False)
    course_code = db.Column(db.String(20), unique=True, nullable=False)

class Lesson(db.Model):
    __tablename__ = 'lessons'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    markdown_content = db.Column(db.Text, nullable=True)
    relevant_images = db.Column(JSON, nullable=True)
    uploaded_images = db.Column(JSON, nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)

class LabManual(db.Model):
    __tablename__ = 'lab_manuals'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    markdown_content = db.Column(db.Text, nullable=False)
    uploaded_images = db.Column(JSON, nullable=True)
    exp_aim = db.Column(db.Text, nullable=False)
    exp_number = db.Column(db.Integer, nullable=False)
