import os
import string
import random
import secrets
from io import BytesIO
from server import db, bcrypt
from models.student_schema import User, Topic, Module, CompletedModule, Query, OngoingModule, ProjectsStudent
from datetime import datetime
from gtts import gTTS
from sqlalchemy import desc
from flask import request, session, jsonify, send_file, Blueprint, send_from_directory
from concurrent.futures import ThreadPoolExecutor
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from langchain_community.vectorstores import FAISS
from api.serper_client import SerperProvider
from core.rag import MultiModalRAG, SimpleRAG
from server.constants import *
from server.utils import ServerUtils
import json
import uuid
import re
import ast
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson.objectid import ObjectId
from bson.errors import InvalidId 
from urllib.parse import quote_plus
from werkzeug.security import check_password_hash, generate_password_hash
from ..controllers.chat_controllers import access_chat, fetch_chats, create_group_chat, rename_group, add_to_group, remove_from_group, get_id_type
from ..controllers.message_controllers import send_message, all_messages
from sqlalchemy import or_

teachers = Blueprint(name='teachers', import_name=__name__)
password = quote_plus(os.getenv("MONGO_PASS"))
uri = "mongodb+srv://ishashah2303:" + password + \
    "@cluster0.mp52ofe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))
mongodb = client["CodeDIV"]
teachers_collection = mongodb["teacher"]
lessons_collection = mongodb["lessons"]
courses_collection = mongodb["course"]
lab_manuals_collection = mongodb["lab_manuals"]
projects_collection = mongodb["projects"]

assignments_collection = mongodb["assignments"] 



# def get_id_type(id_value):

#     # MongoDB ObjectID
#     if isinstance(id_value, ObjectId):
#         return "ObjectId"

#     if isinstance(id_value, str):
#         if len(id_value) == 24:
#             try:
#                 ObjectId(id_value)
#                 # MongoDB string id
#                 return "ObjectId"
#             except InvalidId:
#                 # Invalid
#                 pass 
        
#         # Mail, name, github_id, github_PAT
#         return "String"

#     # SQL
#     if isinstance(id_value, int):
#         return "Integer"
    
#     return f"Other ({type(id_value).__name__})"

@teachers.route('/register', methods=['POST'])
def register():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    email = request.form.get('email')
    password = request.form.get('password')
    college_name = request.form.get('college_name')
    department = request.form.get('department')
    experience = request.form.get('experience')
    phone_number = request.form.get('phone_number')
    qualification = request.form.get('qualification')
    subjects = request.form.get('subjects')
    country = request.form.get('country')
    state = request.form.get('state')
    city = request.form.get('city')
    gender = request.form.get('gender')
    age = request.form.get('age')
    github_id = request.form.get('github_id')
    github_PAT = request.form.get('github_PAT')
    pic = request.form.get('pic')

    if not first_name or not last_name or not email or not password:
        return jsonify({"message": "First name, last name, email, and password are required."}), 400

    if teachers_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists", "response": False}), 201

    new_teacher = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": generate_password_hash(password),
        "college_name": college_name,
        "department": department,
        "experience": experience,
        "phone_number": phone_number,
        "qualification": qualification,
        "subjects": subjects,
        "country": country,
        "state": state,
        "city": city,
        "gender": gender,
        "age": age,
        "github_id": github_id,
        "github_PAT": github_PAT,
        "pic": pic if pic else "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    }

    result = teachers_collection.insert_one(new_teacher)
    
    user_info = {
            "_id": str(result.inserted_id),
            "name": f"{first_name} {last_name}",
            "email": email,
            "pic": new_teacher["pic"], # Use the pic URL (provided or default)
            "type": "teacher"
            # Add other fields if needed by frontend immediately
        }

    return jsonify({"message": "Registration successful!", "teacher_id": str(new_teacher["_id"]),"user_info":user_info,"type": "teacher","response": True}), 200


@teachers.route('/login', methods=['POST'])
def login():
    data: dict = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    teacher = teachers_collection.find_one({"email": email})

    if teacher is None or not check_password_hash(teacher.get("password"), password):
        return jsonify({"message": "Invalid email or password."}), 401
    session.permanent = True
    session['teacher_id'] = str(teacher["_id"])
    session.modified = True
    user_info = {
        "_id": str(teacher["_id"]),
        "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
        "email": teacher.get("email"),
        "pic": teacher.get("pic", "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"), # Provide default pic
        "type": "teacher"
        # Add other fields if needed by frontend
    }
    return jsonify({"message": "Login successful!", "teacher_id": str(teacher["_id"]),"user_info":user_info ,"type": "teacher","response": True}), 200


@teachers.route('/create-course', methods=['POST'])
def create_course():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in", "response": False}), 401

    try:
        course_name = request.form['course_name']
        num_lectures = request.form['num_lectures']
        lessons = request.form['lessons']
        course_code = ServerUtils.generate_course_code(
            courses_collection, length=6)

        new_course = {
            "course_name": course_name,
            "num_of_lectures": num_lectures,
            "teacher_id": teacher_id,
            "lessons_data": lessons,
            "course_code": course_code,
        }

        result = courses_collection.insert_one(new_course)

        session['course_id'] = str(result.inserted_id)
        session['lessons'] = lessons

        return jsonify({
            'message': 'Course and lessons created successfully',
            "course_name": course_name,
            "course_id": str(result.inserted_id)
        }), 200

    except Exception as e:
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500


@teachers.route('/get-courses', methods=['GET'])
def get_courses():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401

    courses = list(courses_collection.find({"teacher_id": teacher_id}))

    courses_data = [
        {
            'id': str(course['_id']),
            'course_name': course.get('course_name'),
            'num_of_lectures': course.get('num_of_lectures'),
            'course_code': course.get('course_code'),
            'lessons_data': course.get('lessons_data'),
        }
        for course in courses
    ]
    return jsonify({"courses": courses_data, "response": True}), 200


@teachers.route('/fetch-lessons', methods=['POST'])
def fetch_lessons():
    teacher_id = session.get('teacher_id')
    data = request.json
    course_id = data.get('course_id')

    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401

    if course_id is None:
        return jsonify({"message": "Course ID not found in the request.", "response": False}), 400

    course = courses_collection.find_one(
        {"_id": ObjectId(course_id), "teacher_id": teacher_id})

    if course is None:
        return jsonify({"message": "Course not found for this teacher."}), 404

    lessons_data: dict = json.loads(course.get("lessons_data", "{}"))
    lesson_statuses = []
    lesson_ids = []

    for lesson_title in lessons_data.keys():
        existing_lesson = lessons_collection.find_one(
            {"title": lesson_title, "course_id": course_id})
        if existing_lesson:
            lesson_statuses.append("View")
            lesson_ids.append(str(existing_lesson["_id"]))
        else:
            lesson_statuses.append("Generate")
            lesson_ids.append(0)

    lab_manuals = list(lab_manuals_collection.find({"course_id": course_id}))
    manual_statuses = []
    manual_ids = []

    for manual in lab_manuals:
        manual_statuses.append("View" if manual else "Generate")
        manual_ids.append(str(manual["_id"]) if manual else 0)

    manuals = [
        {
            "id": str(lm["_id"]),
            "markdown_content": lm.get("markdown_content"),
            "exp_aim": lm.get("exp_aim"),
            "exp_number": lm.get("exp_number"),
        }
        for lm in lab_manuals
    ]

    return jsonify({
        "lessons": lessons_data,
        "lesson_statuses": lesson_statuses,
        "lesson_ids": lesson_ids,
        "lab_manuals": manuals,
        "manual_statuses": manual_statuses,
        "manual_ids": manual_ids
    }), 200


@teachers.route('/multimodal-rag-submodules', methods=['POST'])
async def multimodal_rag_submodules():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in", "response": False}), 401

    if 'files[]' not in request.files:
        files = []
    else:
        files = request.files.getlist('files[]')
    lesson_name = request.form['lesson_name']
    course_name = request.form['course_name']
    lesson_type = request.form.get('lesson_type', 'theoretical')
    include_images = request.form.get("includeImages", "false")
    if include_images == "true":
        include_images = True
    else:
        include_images = False
    if lesson_name == "":
        raise Exception("lesson_name must be provided")
    description = request.form['description']

    lesson_name = re.sub(r'[<>:"/\\|?*]', '_', lesson_name)
    current_dir = os.path.dirname(__file__)
    uploads_path = os.path.join(current_dir, 'uploaded-documents', lesson_name)
    if not os.path.exists(uploads_path):
        os.makedirs(uploads_path)

    for file in files:
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(uploads_path, filename))
    links = request.form.get('links')
    links_list = []
    if links:
        links_list = json.loads(links)
        print(f"\nLinks provided: {links_list}\n")
    search_web = request.form.get("search_web", "false")
    if search_web == "true":
        search_web = True
    else:
        search_web = False
    session['search_web'] = search_web

    if len(files) > 0 and len(links_list) > 0:
        session['input_type'] = 'pdf_and_link'
        print("\nInput: File + Links...\nLinks: ", links_list)
        multimodal_rag = MultiModalRAG(
            course_name=course_name,
            lesson_name=lesson_name,
            lesson_type=lesson_type,
            documents_directory_path=uploads_path,
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="pdf_and_link",
            links=links_list,
            include_images=include_images
        )
    elif len(files) > 0 and search_web:
        session['input_type'] = 'pdf_and_web'
        print("\nInput: File + Web Search...\n")
        multimodal_rag = MultiModalRAG(
            course_name=course_name,
            lesson_name=lesson_name,
            lesson_type=lesson_type,
            documents_directory_path=uploads_path,
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="pdf_and_web",
            links=links_list,
            include_images=include_images
        )
    elif len(files) > 0:
        session['input_type'] = 'pdf'
        print("\nInput: File only...\n")
        multimodal_rag = MultiModalRAG(
            course_name=course_name,
            lesson_name=lesson_name,
            lesson_type=lesson_type,
            documents_directory_path=uploads_path,
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="pdf",
            include_images=include_images
        )
    elif len(links_list) > 0:
        session['input_type'] = 'link'
        print("\nInput: Links only...\nLinks: ", links_list)
        multimodal_rag = MultiModalRAG(
            course_name=course_name,
            lesson_name=lesson_name,
            lesson_type=lesson_type,
            documents_directory_path=uploads_path,
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="link",
            links=links_list,
            include_images=include_images
        )
    elif search_web:
        session['input_type'] = 'web'
        print("\nInput: Web Search only...\n")
        submodules = SUB_MODULE_GENERATOR.generate_submodules_from_web(
            lesson_name, course_name)
        session['lesson_name'] = lesson_name
        session['course_name'] = course_name
        session['lesson_type'] = lesson_type
        session['user_profile'] = description
        session['submodules'] = submodules
        session['is_multimodal_rag'] = False
        print("\nGenerated Submodules:\n", submodules)
        return jsonify({"message": "Query successful", "submodules": submodules, "response": True}), 200
    else:
        print("\nInput: None\n")
        submodules = SUB_MODULE_GENERATOR.generate_submodules(lesson_name)
        session['lesson_name'] = lesson_name
        session['course_name'] = course_name
        session['lesson_type'] = lesson_type
        session['user_profile'] = description
        session['submodules'] = submodules
        session['is_multimodal_rag'] = False
        print("\nGenerated Submodules:\n", submodules)
        return jsonify({"message": "Query successful", "submodules": submodules, "response": True}), 200

    text_vectorstore_path, image_vectorstore_path = await multimodal_rag.create_text_and_image_vectorstores()

    session['text_vectorstore_path'] = text_vectorstore_path
    session['image_vectorstore_path'] = image_vectorstore_path

    VECTORDB_TEXTBOOK = FAISS.load_local(
        text_vectorstore_path, EMBEDDINGS, allow_dangerous_deserialization=True)

    if search_web:
        submodules = await SUB_MODULE_GENERATOR.generate_submodules_from_documents_and_web(module_name=lesson_name, course_name=course_name, vectordb=VECTORDB_TEXTBOOK)
    else:
        submodules = SUB_MODULE_GENERATOR.generate_submodules_from_textbook(
            lesson_name, VECTORDB_TEXTBOOK)

    session['lesson_name'] = lesson_name
    session['course_name'] = course_name
    session['lesson_type'] = lesson_type
    session['user_profile'] = description
    session['submodules'] = submodules
    session['document_directory_path'] = uploads_path
    session['is_multimodal_rag'] = True
    session['include_images'] = include_images
    print("\nGenerated Submodules:\n", submodules)
    return jsonify({"message": "Query successful", "submodules": submodules, "response": True}), 200


@teachers.route('/update-submodules', methods=['POST'])
def update_submodules():
    updated_submodules = request.get_json()
    session['submodules'] = updated_submodules
    return jsonify({'message': 'Submodules updated successfully'}), 200


@teachers.route('/multimodal-rag-content', methods=['GET'])
async def multimodal_rag_content():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in", "response": False}), 401

    is_multimodal_rag = session.get("is_multimodal_rag")
    search_web = session.get("search_web")
    course_name = session.get("course_name")
    lesson_name = session.get("lesson_name")
    lesson_type = session.get("lesson_type")
    user_profile = session.get("user_profile")
    submodules = session.get("submodules")
    if is_multimodal_rag:
        document_paths = session.get("document_directory_path")
        text_vectorstore_path = session.get("text_vectorstore_path")
        image_vectorstore_path = session.get("image_vectorstore_path")
        input_type = session.get('input_type')
        include_images = session.get('include_images')
        multimodal_rag = MultiModalRAG(
            course_name=course_name,
            documents_directory_path=document_paths,
            lesson_name=lesson_name,
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            chunk_size=1000,
            chunk_overlap=200,
            image_similarity_threshold=0.1,
            input_type=input_type,
            text_vectorstore_path=text_vectorstore_path,
            image_vectorstore_path=image_vectorstore_path,
            include_images=include_images
        )
        content_list, relevant_images_list = await multimodal_rag.execute(CONTENT_GENERATOR, TAVILY_CLIENT, lesson_name, submodules=submodules, profile=user_profile, top_k_docs=7, search_web=search_web)
        final_content = ServerUtils.json_list_to_markdown(content_list)
        return jsonify({"message": "Query successful", "relevant_images": relevant_images_list, "content": final_content, "response": True}), 200
    elif search_web:
        keys_list = list(submodules.keys())
        submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
        submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
        submodules_split_three = {
            key: submodules[key] for key in keys_list[4:]}
        with ThreadPoolExecutor() as executor:
            future_images_list = executor.submit(
                SerperProvider.module_image_from_web, submodules)
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content_from_web_with_profile,
                                                 submodules_split_one, lesson_name, course_name, lesson_type, user_profile, 'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content_from_web_with_profile,
                                                 submodules_split_two, lesson_name, course_name, lesson_type, user_profile, 'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content_from_web_with_profile,
                                                   submodules_split_three, lesson_name, course_name, lesson_type, user_profile, 'third')
        content_one = future_content_one.result()
        content_two = future_content_two.result()
        content_three = future_content_three.result()
        relevant_images_list = future_images_list.result()
        content_list = content_one + content_two + content_three
        final_content = ServerUtils.json_list_to_markdown(content_list)
        return jsonify({"message": "Query successful", "relevant_images": relevant_images_list, "content": final_content, "response": True}), 200
    else:
        keys_list = list(submodules.keys())
        submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
        submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
        submodules_split_three = {
            key: submodules[key] for key in keys_list[4:]}
        with ThreadPoolExecutor() as executor:
            future_images_list = executor.submit(
                SerperProvider.module_image_from_web, submodules)
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content_with_profile,
                                                 submodules_split_one, lesson_name, course_name, lesson_type, user_profile, 'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content_with_profile,
                                                 submodules_split_two, lesson_name, course_name, lesson_type, user_profile, 'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content_with_profile,
                                                   submodules_split_three, lesson_name, course_name, lesson_type, user_profile, 'third')
        content_one = future_content_one.result()
        content_two = future_content_two.result()
        content_three = future_content_three.result()
        relevant_images_list = future_images_list.result()
        content_list = content_one + content_two + content_three
        final_content = ServerUtils.json_list_to_markdown(content_list)
        return jsonify({"message": "Query successful", "relevant_images": relevant_images_list, "content": final_content, "response": True}), 200


@teachers.route('/projects', methods=["POST"])
def get_projects_list():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401
    teacher = teachers_collection.find_one({"_id": ObjectId(teacher_id)})
    teacher_github_id = str(teacher["github_id"])
    print(teacher_github_id)
    projects = list(projects_collection.find(
        {'github_id': str(teacher_github_id)}))
    projects_list = []
    for project in projects:
        project['_id'] = str(project['_id'])
        projects_list.append(project)

    return jsonify({
        "message": "Query successful",
        "projects": projects_list,
        "response": True
    }), 200


@teachers.route('/projects/<string:projectname>', methods=["POST"])
def get_project(projectname):
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401
    teacher = teachers_collection.find_one({"_id": ObjectId(teacher_id)})
    teacher_github_id = str(teacher["github_id"])
    teacher_github_PAT = str(teacher["github_PAT"])
    print(projectname)
    project = projects_collection.find_one(
        {"github_id": teacher_github_id, "project_name": projectname})
    return jsonify({"message": "Query successful", "project": projectname, "github_PAT": teacher_github_PAT, "github_id": str(project["owner_id"]), "response": True}), 200


@teachers.route('/create_project', methods=['POST'])
@cross_origin(supports_credentials=True)
def create_project():
    teacher_id = session.get('teacher_id')
    print(teacher_id)
    if teacher_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    teacher = teachers_collection.find_one({"_id": ObjectId(teacher_id)})
    teacher_github_id = str(teacher["github_id"])
    current_teacher_github_id = teacher_github_id
    teacher_github_PAT = str(teacher["github_PAT"])

    data = request.json
    project_name = data.get("project_name")
    teachers_list = data.get("teachers_list", [])
    students_list = data.get("students_list", [])

    new_project_teacher = {
        "project_name": project_name,
        "github_id": teacher_github_id,
        "owner_id": teacher_github_id,
    }

    projects_collection.insert_one(new_project_teacher)

    if not project_name:
        return jsonify({"message": "Project name is required", "response": False}), 400

    for student_github_id in students_list:
        user = User.query.filter_by(github_id=student_github_id).first()
        if not user:
            return jsonify({"message": "Student not found", "response": False}), 400
        new_project_student = ProjectsStudent(
            project_name=project_name,
            github_id=student_github_id,
            owner_id=teacher_github_id,
        )
        db.session.add(new_project_student)
        db.session.commit()

    for teacher_github_id in teachers_list:
        teacher = teachers_collection.find_one(
            {"github_id": teacher_github_id})

        if teacher:

            new_project_teacher = {
                "project_name": project_name,
                "github_id": teacher_github_id,
                "owner_id": current_teacher_github_id
            }

            projects_collection.insert_one(new_project_teacher)
        else:
            return jsonify({"message": "Incorrect teacher github name", "response": False}), 400

    return jsonify({"message": "Project created successfully", "github_id": current_teacher_github_id, "github_PAT": teacher_github_PAT, "response": True}), 201


@teachers.route('/add-lesson', methods=['POST'])
def add_lesson():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401

    data: dict = request.get_json()
    title = data.get('title')
    markdown_content = data.get('markdown_content', '')
    relevant_images = data.get('relevant_images', None)
    uploaded_images = data.get('uploaded_images', None)
    markdown_images = data.get('markdown_images', None)
    course_id = data.get('course_id')
    lesson_id = data.get('lesson_id', None)

    if not course_id:
        return jsonify({"message": "Course ID is required."}), 400

    if lesson_id:
        lesson: dict = lessons_collection.find_one(
            {"_id": ObjectId(lesson_id)})
        if not lesson or lesson.get("teacher_id") != teacher_id:
            return jsonify({"message": "Lesson not found or you do not have permission to edit it."}), 404

        lessons_collection.update_one(
            {"_id": ObjectId(lesson_id)},
            {"$set": {
                "markdown_content": json.dumps(markdown_content),
                "relevant_images": json.dumps(relevant_images),
                "uploaded_images": json.dumps(uploaded_images),
                "markdown_images": json.dumps(markdown_images),
            }}
        )
    else:
        new_lesson = {
            "title": title,
            "markdown_content": json.dumps(markdown_content),
            "relevant_images": json.dumps(relevant_images),
            "uploaded_images": json.dumps(uploaded_images),
            "markdown_images": json.dumps(markdown_images),
            "teacher_id": teacher_id,
            "course_id": course_id
        }
        result = lessons_collection.insert_one(new_lesson)
        new_lesson_id = str(result.inserted_id)

    lesson_id_to_return = lesson_id if lesson_id else new_lesson_id
    return jsonify({"message": "Lesson saved successfully!", "lesson_id": lesson_id_to_return, "response": True}), 200


@teachers.route('/get-lesson', methods=['POST'])
def get_lesson():
    data = request.get_json()
    lesson_id = data.get('lesson_id')
    if not lesson_id:
        return jsonify({"message": "Lesson ID is required."}), 400

    lesson: dict = lessons_collection.find_one({"_id": ObjectId(lesson_id)})
    if lesson is None:
        return jsonify({"message": "Lesson not found."}), 404

    lesson_data = {
        "id": str(lesson.get("_id")),
        "title": lesson.get("title"),
        "markdown_content": lesson.get("markdown_content"),
        "relevant_images": lesson.get("relevant_images"),
        "markdown_images": lesson.get("markdown_images"),
        "uploaded_images": lesson.get("uploaded_images"),
        "teacher_id": lesson.get("teacher_id"),
        "course_id": lesson.get("course_id")
    }

    return jsonify(lesson_data), 200


@teachers.route('/generate-lesson', methods=['POST'])
async def generate_lesson():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in", "response": False}), 401

    num_lectures = request.form.get('num_lectures')
    course_name = request.form.get('course_name')
    file = request.files.get('syllabus')
    current_dir = os.path.dirname(__file__)
    uploads_path = os.path.join(current_dir, 'uploaded-documents', 'syllabus')
    if not os.path.exists(uploads_path):
        os.makedirs(uploads_path)
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(uploads_path, filename))

    simple_rag = SimpleRAG(
        course_name=course_name,
        syllabus_directory_path=uploads_path,
        embeddings=EMBEDDINGS,
    )
    await simple_rag.create_text_vectorstore()
    relevant_text = await simple_rag.search_similar_text(query=course_name, k=10)
    output = LESSON_PLANNER.generate_lesson_plan(
        course_name=course_name, context=relevant_text, num_lectures=num_lectures)
    return jsonify({"message": "Query successful", "lessons": output, "response": True}), 200


@teachers.route('/generate-lab-manual', methods=['POST'])
def generate_lab_manual():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in", "response": False}), 401

    teacher = teachers_collection.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        return jsonify({"message": "Teacher not found", "response": False}), 404

    teacher_name = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
    data: dict = request.json
    experiment_num = data.get('exp_num')
    exp_aim = data.get('exp_aim')
    course_name = data.get('course_name')
    include_videos = data.get('include_videos')
    if include_videos == 'true':
        include_videos = True
    else:
        include_videos = False
    components = data.get('lab_components', [])

    result = LAB_MANUAL_GENERATOR.generate_lab_manual(
        experiment_aim=exp_aim,
        experiment_num=experiment_num,
        teacher_name=teacher_name,
        course_name=course_name,
        components=components,
        include_videos=include_videos
    )

    return jsonify({"message": "Query successful", "MarkdownContent": result, "response": True}), 200


@teachers.route('/create-lab-manual-docx', methods=['POST'])
def convert_docx():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in", "response": False}), 401

    # try:
    data = request.json
    lab_manual_id = data.get('lab_manual_id')
    if not lab_manual_id:
        return jsonify({"message": "Lab manual ID is required", "response": False}), 400

    from bson import ObjectId
    if not ObjectId.is_valid(lab_manual_id):
        return jsonify({"message": "Invalid lab manual ID", "response": False}), 400

    lab_manual = lab_manuals_collection.find_one(
        {"_id": ObjectId(lab_manual_id), "teacher_id": teacher_id}
    )
    if not lab_manual:
        return jsonify({"message": "Lab manual not found", "response": False}), 404
    course_id = lab_manual.get('course_id')
    if not course_id:
        return jsonify({"message": "Course ID not found in lab manual", "response": False}), 400

    if not ObjectId.is_valid(course_id):
        return jsonify({"message": "Invalid course ID", "response": False}), 400
    course = courses_collection.find_one({"_id": ObjectId(course_id)})
    if not course:
        return jsonify({"message": "Course not found", "response": False}), 404
    course_name = course.get('name', 'Unknown_Course')
    markdown = lab_manual.get('markdown_content', '')
    exp_num = lab_manual.get('exp_number', 'Unknown_Experiment')
    image_list = json.loads(lab_manual.get('markdown_images'))
    doc = LabManualGenerator.convert_markdown_to_docx(
        input_file=markdown, course_name=course_name, exp_num=exp_num)

    return send_file(
        doc,
        as_attachment=True,
        download_name=f"{course_name}_{exp_num}.docx",
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    # except Exception as e:
    #     print("An error occurred while creating the document:", e)
    #     return jsonify({"message": "Failed to create document", "response": False}), 500


@teachers.route('/add-lab-manual', methods=['POST'])
def add_lab_manual():
    teacher_id = session.get('teacher_id')
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401

    data: dict = request.get_json()
    course_id = data.get('course_id')
    exp_aim = data.get('exp_aim', '')
    exp_number = data.get('exp_num')
    markdown_content = data.get('markdown_content', '')
    uploaded_images = data.get('uploaded_images', None)
    markdown_images = data.get('markdown_images', None)
    lab_manual_id = data.get('lab_manual_id', None)

    if course_id is None:
        return jsonify({"message": "Course ID,  are required."}), 400

    if lab_manual_id:
        lab_manual: dict = lab_manuals_collection.find_one(
            {"_id": ObjectId(lab_manual_id)})
        if not lab_manual or lab_manual.get("teacher_id") != teacher_id:
            return jsonify({"message": "Lab manual not found or you do not have permission to edit it."}), 404

        lab_manuals_collection.update_one(
            {"_id": ObjectId(lab_manual_id)},
            {"$set": {
                "markdown_content": markdown_content,
                "markdown_images": json.dumps(markdown_images),
                "uploaded_images": json.dumps(uploaded_images)
            }}
        )
    else:
        new_lab_manual = {
            "course_id": course_id,
            "teacher_id": teacher_id,
            "exp_aim": exp_aim,
            "exp_number": exp_number,
            "markdown_content": markdown_content,
            "markdown_images": json.dumps(markdown_images),
            "uploaded_images": json.dumps(uploaded_images)
        }
        result = lab_manuals_collection.insert_one(new_lab_manual)
        new_lab_manual_id = str(result.inserted_id)

    lab_manual_id_to_return = lab_manual_id if lab_manual_id else new_lab_manual_id
    return jsonify({"message": "Lab manual saved successfully!", "lab_manual_id": lab_manual_id_to_return, "response": True}), 200


@teachers.route('/fetch-lab-manual', methods=['POST'])
def fetch_lab_manual():
    data = request.get_json()
    lab_manual_id = data.get('lab_manual_id')

    if not lab_manual_id:
        return jsonify({"message": "Lab manual ID is required."}), 400

    lab_manual: dict = lab_manuals_collection.find_one(
        {"_id": ObjectId(lab_manual_id)})

    if lab_manual is None:
        return jsonify({"message": "Lab manual not found."}), 404

    lab_manual_data = {
        "id": str(lab_manual.get("_id")),
        "course_id": lab_manual.get("course_id"),
        "teacher_id": lab_manual.get("teacher_id"),
        "markdown_content": lab_manual.get("markdown_content"),
        "markdown_images": lab_manual.get("markdown_images"),
        "uploaded_images": lab_manual.get("uploaded_images"),
        "exp_aim": lab_manual.get("exp_aim"),
        "exp_number": lab_manual.get("exp_number")
    }

    return jsonify(lab_manual_data), 200


@teachers.route('/download-ppt', methods=['POST'])
def download_ppt():
    teacher_id = session.get("teacher_id")
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401

    try:
        data: dict = request.get_json()
        lesson_id = data.get("lesson_id")

        if not lesson_id:
            return jsonify({"message": "Lesson ID not provided.", "response": False}), 400

        lesson: dict = lessons_collection.find_one(
            {"_id": ObjectId(lesson_id)})
        if not lesson:
            return jsonify({"message": "Lesson not found.", "response": False}), 404

        course_id = lesson.get("course_id")
        course: dict = courses_collection.find_one(
            {"_id": ObjectId(course_id)})
        if not course:
            return jsonify({"message": "Course not found.", "response": False}), 404

        course_name = course.get("course_name", "Default Course")
        lesson_name = lesson.get("title", "Default Lesson")
        lesson_name = re.sub(r'[<>:"/\\|?*]', '_', lesson_name) + ".pptx"
        markdown_list = ast.literal_eval(lesson.get("markdown_content", []))
        markdown_images_list = json.loads(lesson.get("markdown_images", []))
        presentation_content = PPT_GENERATOR.generate_ppt_content(
            markdown_list=markdown_list)
        # ppt_gen = PPT_GENERATOR(presentation_content, course_name=course_name, lesson_name=lesson_name, markdown_images_list=markdown_images_list)
        downloads_path = PPT_GENERATOR.generate_ppt(
            markdown_list=presentation_content, markdown_images_list=markdown_images_list, course_name=course_name, lesson_name=lesson_name)

        return send_file(
            downloads_path,
            as_attachment=True,
        )

    except Exception as e:
        print(f"Error while creating ppt: {e}")
        return jsonify({"message": "An error occurred while creating the presentation.", "response": False}), 500


@teachers.route('/download-pdf', methods=['POST'])
def download_pdf():
    teacher_id = session.get("teacher_id")
    if teacher_id is None:
        return jsonify({"message": "Teacher not logged in.", "response": False}), 401

    data = request.get_json()
    lesson_id = data.get("lesson_id")

    if not lesson_id:
        return jsonify({"message": "Lesson ID not provided.", "response": False}), 400

    lesson = lessons_collection.find_one({"_id": ObjectId(lesson_id)})
    if not lesson:
        return jsonify({"message": "Lesson not found.", "response": False}), 404

    course_id = lesson.get("course_id")
    course = courses_collection.find_one({"_id": ObjectId(course_id)})
    if not course:
        return jsonify({"message": "Course not found.", "response": False}), 404

    course_name = course.get("course_name", "Default Course")
    lesson_name = lesson.get("title", "Default Lesson")
    lesson_name = re.sub(r'[<>:"/\\|?*]', '_', lesson_name) + ".pdf"
    markdown_content = json.loads(lesson.get("markdown_content", "{}"))
    markdown_images = json.loads(lesson.get("markdown_images", "{}"))

    pdf_path = os.path.join("/tmp", lesson_name)
    pdf_dir = os.path.dirname(pdf_path)
    if not os.path.exists(pdf_dir):
        os.makedirs(pdf_dir, exist_ok=True)
    TEACHER_PDF_GENERATOR.generate_pdf(
        pdf_path, course_name, markdown_content, markdown_images)

    return send_file(pdf_path, as_attachment=True)


@teachers.route('/logout', methods=['GET'])
@cross_origin(supports_credentials=True)
def logout():
    session.clear()
    return jsonify({"message": "User logged out successfully", "response": True}), 200


#############------------------Code DIV Changes----------------##################

from core.code_div import *
import tempfile

@teachers.route('/timetable', methods=['POST'])
def generate_timetable_route():
    data = request.get_json()
    teachers_subjects = data.get("teachers_subjects", {}) #{teacher:[sub1,sub2]}
    classes_subjects=data.get("class_subjects", {}) #{class:[sub1,sub2]}
    hours_per_week = data.get("hours_per_week", {}) #{subject:hours}
    preferred_slots = data.get("preferred_slots", {}) #{teacher:"slot"}
    classrooms = data.get("classrooms", []) # [classroom1, classroom2]
    labs = data.get("labs", []) # [lab1, lab2]
    lab_requirements = data.get("lab_requirements", {}) #{sub:lab1}
    theory_requirements = data.get("theory_requirements", []) #[sub1,sub2]
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    
    print("Teachers and Subjects:", teachers_subjects)
    print("Class Subjects:", classes_subjects)
    print("Hours per Week:", hours_per_week)
    print("Preferred Slots:", preferred_slots)
    print("Classrooms:", classrooms)
    print("Labs:", labs)
    print("Lab Requirements:", lab_requirements)
    print("Theory Requirements:", theory_requirements)
    print("Start Time:", start_time)
    print("End Time:", end_time)
    
    timetable = generate_timetable(teachers_subjects, classes_subjects, hours_per_week, preferred_slots, classrooms,labs, lab_requirements,theory_requirements, start_time, end_time)
    
    if isinstance(timetable, str):  # Convert string to dictionary if needed
        timetable = json.loads(timetable)
    
    # print(timetable)
    excel_file = save_timetable_to_excel(timetable)
    return send_file(excel_file, as_attachment=True, download_name="timetable.xlsx")


assignments_collection = mongodb["assignments"] 

# 1. Create Assignment (Teacher Side)
@teachers.route('/create-assignment', methods=['POST'])
def create_assignment():
    data = request.json
    assignment_name = data.get("assignment_name")
    subject_name = data.get("subject_name")
    details = data.get("details")
    active = data.get("active", True)  # default to active

    if not assignment_name or not subject_name:
        return jsonify({"error": "Assignment name and subject name are required"}), 400

    # Generate a unique assignment ID using uuid4
    assignment_id = str(uuid.uuid4())

    assignment = {
        "assignment_id": assignment_id,
        "assignment_name": assignment_name,
        "subject_name": subject_name,
        "details": details,
        "active": active,
        "created_at": datetime.now(),
        "evaluations": []  # To store student submissions
    }

    result = assignments_collection.insert_one(assignment)
    return jsonify({
        "message": "Assignment created successfully",
        "assignment_id": assignment_id
    })


# 2. Fetch All Assignments (Teacher & Student)
@teachers.route('/fetch-assignments', methods=['GET'])
def fetch_assignments():
    assignments = list(assignments_collection.find({}, {"_id": 0}))
    return jsonify({"assignments": assignments})

@teachers.route('/fetch-marks', methods=['GET'])
def fetch_marks():
    assignment_id = request.args.get("assignment_id")
    if not assignment_id:
        return jsonify({"error": "Assignment ID is required"}), 400

    assignment = assignments_collection.find_one(
        {"assignment_id": assignment_id},
        {"evaluations": 1, "_id": 0}
    )

    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    evaluations = assignment.get("evaluations", [])
    # Format the evaluations with only the desired fields.
    formatted_evaluations = []
    for evaluation in evaluations:
        formatted_evaluations.append({
            "student_id": evaluation.get("student_id"),
            "total_marks_obtained": evaluation.get("total_marks_obtained"),
            "marks": evaluation.get("marks"),
            "justification": evaluation.get("justification")
        })

    return jsonify({"evaluations": formatted_evaluations})


# Add these helper functions in the teachers blueprint
def get_teacher_by_id(teacher_id):
    """Get teacher by ID"""
    id_type = get_id_type(teacher_id)
    
    if id_type == "ObjectId" or (isinstance(teacher_id, str) and len(teacher_id) == 24):
        try:
            return teachers_collection.find_one({"_id": ObjectId(teacher_id)})
        except InvalidId:
            pass
    
    return None

def get_student_by_id(student_id):
    """Get student by ID"""
    id_type = get_id_type(student_id)
    
    if id_type == "Integer":
        return User.query.get(student_id)
    
    return None

# Add these routes to the teachers blueprint
@teachers.route('/chats', methods=['POST'])
def teacher_access_chat():
    teacher_id = session.get("teacher_id", None)
    print(f"FLASK /chats - Session BEFORE access: {dict(session)}") 
    print(teacher_id)
    return access_chat(request, mongodb, is_teacher=True, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=teacher_id)

@teachers.route('/chats', methods=['GET'])
def teacher_fetch_chats():
    teacher_id = session.get("teacher_id", None)
    print(f"FLASK /chats - Session BEFORE access: {dict(session)}") 
    print(teacher_id)
    return fetch_chats(mongodb, is_teacher=True, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=teacher_id)

@teachers.route('/chats/group', methods=['POST'])
def teacher_create_group_chat():
    teacher_id = session.get("teacher_id", None)
    return create_group_chat(request, mongodb, is_teacher=True, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=teacher_id)

@teachers.route('/chats/rename', methods=['PUT'])
def teacher_rename_group():
    teacher_id = session.get("teacher_id", None)
    return rename_group(request, mongodb, is_teacher=True,current_user_id=teacher_id)

@teachers.route('/chats/groupadd', methods=['PUT'])
def teacher_add_to_group():
    teacher_id = session.get("teacher_id", None)
    return add_to_group(request, mongodb, is_teacher=True,current_user_id=teacher_id)

@teachers.route('/chats/groupremove', methods=['PUT'])
def teacher_remove_from_group():
    teacher_id = session.get("teacher_id", None)
    return remove_from_group(request, mongodb, is_teacher=True,current_user_id=teacher_id)

@teachers.route('/messages', methods=['POST'])
def teacher_send_message():
    teacher_id = session.get("teacher_id", None)
    return send_message(request, mongodb, is_teacher=True, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=teacher_id)

@teachers.route('/messages/<chat_id>', methods=['GET'])
def teacher_all_messages(chat_id):
    teacher_id = session.get("teacher_id", None)
    return all_messages(chat_id, mongodb, is_teacher=True, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=teacher_id)

# Add a route for searching users (teachers and students) for chat
@teachers.route('/users/search', methods=['GET'])
def search_users():
    search_query = request.args.get('search', '')
    if not search_query:
        return jsonify([]), 200
    
    # Get current teacher ID
    teacher_id = session.get("teacher_id", None)
    if not teacher_id:
        return jsonify({"message": "Not logged in"}), 401
    
    # Search for teachers
    teacher_results = list(teachers_collection.find({
        "$and": [
            {"_id": {"$ne": ObjectId(teacher_id)}},
            {"$or": [
                {"first_name": {"$regex": search_query, "$options": "i"}},
                {"last_name": {"$regex": search_query, "$options": "i"}},
                {"email": {"$regex": search_query, "$options": "i"}}
            ]}
        ]
    }))
    
    # Search for students
    student_results = User.query.filter(
        or_(
            User.fname.ilike(f'%{search_query}%'),
            User.lname.ilike(f'%{search_query}%'),
            User.email.ilike(f'%{search_query}%')
        )
    ).all()
    
    # Format results
    formatted_results = []
    
    # Format teacher results
    for teacher in teacher_results:
        formatted_results.append({
            "_id": str(teacher["_id"]),
            "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
            "email": teacher.get('email', ''),
            "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
            "type": "teacher"
        })
    
    # Format student results
    for student in student_results:
        formatted_results.append({
            "_id": student.user_id,
            "name": f"{student.fname} {student.lname}",
            "email": student.email,
            "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
            "type": "student"
        })
    
    return jsonify(formatted_results), 200