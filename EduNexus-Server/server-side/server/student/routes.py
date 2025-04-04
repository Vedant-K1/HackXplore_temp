import os
import string
import secrets
from io import BytesIO
from server import db, bcrypt
from datetime import datetime
from gtts import gTTS
from sqlalchemy import desc
from deep_translator import GoogleTranslator
from flask import request, session, jsonify, send_file, Blueprint
from models.student_schema import User, Topic, Module, CompletedModule, Query, OngoingModule,ProjectsStudent
from concurrent.futures import ThreadPoolExecutor
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from api.serper_client import SerperProvider
from server.constants import *
from server.utils import ServerUtils
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson.objectid import ObjectId
from bson.errors import InvalidId 
from urllib.parse import quote_plus
import json
from ..controllers.chat_controllers import access_chat, fetch_chats, create_group_chat, rename_group, add_to_group, remove_from_group, get_id_type
from ..controllers.message_controllers import send_message, all_messages
from sqlalchemy import or_


students = Blueprint(name='students', import_name=__name__)
password = quote_plus(os.getenv("MONGO_PASS"))
uri = "mongodb+srv://ishashah2303:" + password +"@cluster0.mp52ofe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))
mongodb = client["CodeDIV"]
teachers_collection = mongodb["teacher"]
lessons_collection = mongodb["lessons"]
courses_collection = mongodb["course"]
lab_manuals_collection = mongodb["lab_manuals"]
projects_collection = mongodb["projects"]

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

@students.route('/register',methods=['POST'])
@cross_origin(supports_credentials=True)
def register():
    fname = request.form['firstName']
    lname = request.form['lastName']
    email = request.form['email']
    password = request.form['password']
    country = request.form['country']
    state = request.form['state']
    city = request.form['city']
    gender = request.form['gender']
    age = request.form['age']
    college_name = request.form['college']
    course_name = request.form['course']
    interests = request.form['interest']
    student_id_file = request.files['collegeId']
    github_id = request.form['github_id']
    github_PAT = request.form['github_PAT']
    user_exists = User.query.filter_by(email=email).first() is not None
    pic = request.form['pic']

    if user_exists:
        return jsonify({"message": "User already exists", "response":False}), 201
    
    hash_pass = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(fname=fname, lname=lname, email=email, password=hash_pass, country=country, state=state, city=city, gender=gender, age=age, college_name=college_name, course_name=course_name, interests=interests, student_id=student_id_file.read(),github_id=github_id,github_PAT=github_PAT,pic=pic if pic else "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg")
    db.session.add(new_user)
    db.session.commit()
    
    user_pic = getattr(new_user, 'pic', "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg")
    user_info = {
            "_id": new_user.user_id, # Use the primary key from SQL model
            "name": f"{new_user.fname} {new_user.lname}",
            "email": new_user.email,
            "pic": user_pic,
            "type": "student"
            # Add other fields if needed
        }
    print( "ACTUAL",new_user.user_id)
    session.permanent = True
    session["user_id"] = new_user.user_id # BY ME DHRUVIL
    session.modified = True
    print("SET",session.get("user_id"))
    response = jsonify({"message": "User created successfully", "user_info":user_info,"id":new_user.user_id, "email":new_user.email, "type": "student","response":True}), 200
    # response.set_cookie(
    #     'user_session',                           # Use your actual session cookie name
    #     session.get('user_session'),              # Get actual session value
    #     httponly=True,                       # Not accessible via JavaScript
    #     secure=False,                        # Set to True in production with HTTPS
    #     samesite='None',                     # Critical for cross-origin requests
    #     max_age=60*60*24*7                   # 7 days in seconds
    # )
    return response

# login route  --> add username to session and make it unique in user model
@students.route('/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"message": "Unregistered email id", "response":False}), 200
    
    if not bcrypt.check_password_hash(user.password, password.encode('utf-8')):
        return jsonify({"message": "Incorrect password", "response":False}), 200
    session.permanent = True
    session["user_id"] = user.user_id
    session.modified = True
    print("SET",session.get("user_id"),user.user_id)
    profile = f"Name: {user.fname} {user.lname}, Email: {user.email}, Country: {user.country}, Age: {user.age}, Ongoing Course Name: {user.course_name}, User Interest: {user.interests}"

    assistant = GEMINI_CLIENT.initialize_assistant(profile= profile, tools=TOOLS)
    user_pic = getattr(user, 'pic', "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg")
    user_info = {
        "_id": user.user_id, # Use the primary key from SQL model
        "name": f"{user.fname} {user.lname}",
        "email": user.email,
        "pic": user_pic,
        "type": "student"
        # Add other fields if needed
    }
    response = jsonify({"message": "User logged in successfully", "email":user.email, "type": "student","user_info":user_info,"id":user.user_id,"response":True})
    response.status_code = 200  # Set status code on the response object
    # response.headers.add('Access-Control-Allow-Credentials', 'true')  # Now this works
    response.headers.add('Vary', 'Origin')
    return response

@students.route('/user_profile', methods=['GET', 'POST'])
@cross_origin(supports_credentials=True)
def user_profile():
    user_id = session.get("user_id", None)
    
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    if request.method == 'POST':
        data = request.json
        print("data is printed---------",data)
        user.fname = data.get("fname")
        user.lname = data.get("lname")
        user.email = data.get("email")
        user.country = data.get("country")
        user.state = data.get("state")
        user.gender = data.get("gender")
        user.city = data.get("city")
        user.age = data.get("age")
        user.interests = data.get("interests")
        user.college_name = data.get("college_name")
        user.course_name = data.get("course_name")
        db.session.commit()
    
    user_info = {}
    user_info['fname'] = user.fname
    user_info['lname'] = user.lname
    user_info['email'] = user.email
    user_info['country'] = user.country
    user_info['state'] = user.state
    user_info['city'] = user.city
    user_info['age'] = user.age
    user_info['gender'] = user.gender
    user_info['interests'] = user.interests
    user_info['date_joined'] = user.date_joined
    user_info['college_name'] = user.college_name
    user_info['course_name'] = user.course_name

    return jsonify({"message": "User found", "user_info":user_info, "response":True}), 200


@students.route('/user_dashboard', methods=['GET'])
@cross_origin(supports_credentials=True)
def getuser():
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    completed_modules = []
    ongoing_modules = []

    user_ongoing_modules = user.user_onmodule_association
    user_completed_modules = user.user_module_association
    user_course = user.course_name
    user_interest = user.interests
    all_ongoing_modules_names = ""
  
    for comp_module in user_ongoing_modules:
        temp = {}
        module = Module.query.get(comp_module.module_id)
        topic = Topic.query.get(module.topic_id)
        temp['module_name'] = module.module_name
        temp['topic_name'] = topic.topic_name
        temp['module_summary'] = module.summary
        temp['level'] = module.level
        all_ongoing_modules_names += f"{module.module_name},"
        c_module = CompletedModule.query.filter(CompletedModule.module_id==comp_module.module_id,CompletedModule.user_id==user_id).first()
        if c_module:
            if c_module.theory_quiz_score is not None and c_module.application_quiz_score is not None and c_module.assignment_score is not None:
                temp['quiz_score'] = [c_module.theory_quiz_score, c_module.application_quiz_score, c_module.assignment_score]
                completed_modules.append(temp)
            else:
                temp['date_started'] = comp_module.date_started.strftime("%d/%m/%Y %H:%M")
                quiz_list = [c_module.theory_quiz_score, c_module.application_quiz_score, c_module.assignment_score]
                temp['quiz_score'] = [x for x in quiz_list if x is not None]
                ongoing_modules.append(temp)
        else:
            temp['date_started'] = comp_module.date_started.strftime("%d/%m/%Y %H:%M")
            temp['quiz_score'] = []
            ongoing_modules.append(temp)
            

    query_message = ""
    user_queries = user.user_query_association 
    if len(user_queries) == 0:
        query_message = "You have not searched for any topic yet. Please search for a topic to get recommendations."
        recommended_modules = RECOMMENDATION_GENERATOR.generate_recommendations_with_interests(user_course, user_interest) 
        return jsonify({"message": "User found", "query_message":query_message,"recommended_topics":recommended_modules, "user_ongoing_modules":ongoing_modules, "user_completed_module":completed_modules, "response":True}), 200
    else:
        latest_query = Query.query.filter_by(user_id=user_id).order_by(desc(Query.date_search)).first() 
        base_module = Module.query.filter_by(topic_id=latest_query.topic_id).first()
        print("Module Name:", base_module.module_name)
        print("Module Summary:", base_module.summary)
        recommended_modules = RECOMMENDATION_GENERATOR.generate_recommendations_with_summary(base_module.summary)
        return jsonify({"message": "User found", "query_message":query_message,"recommended_topics":recommended_modules, "user_ongoing_modules":ongoing_modules, "user_completed_module":completed_modules, "response":True}), 200

@students.route('/logout', methods=['GET'])
@cross_origin(supports_credentials=True)
def logout():
    session.clear()
    return jsonify({"message": "User logged out successfully", "response":True}), 200



# delete user route --> user dependent queries and completed topics will also be deleted no need to delete them separately
@students.route('/delete', methods=['DELETE'])
@cross_origin(supports_credentials=True)
def delete():
    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    # select all queries and completed topics by user and delete them
    # user_saved_queries = user.queries
    # user_saved_topics = user.completed_topics

    db.session.delete(user)
    # db.session.delete(user_saved_queries)
    # db.session.delete(user_saved_topics)
    db.session.commit()

    # return response
    return jsonify({"message": "User deleted successfully", "response":True}), 200


# @students.route('/query2/trending/<string:domain>/<string:module_name>/<string:summary>/<string:source_lang>', methods=['GET'])
# @cross_origin(supports_credentials=True)
# def trending_query(domain, module_name, summary, source_lang):
#     # check if user is logged in
#     user_id = session.get("user_id", None)
#     if user_id is None:
#         return jsonify({"message": "User not logged in", "response":False}), 401
    
# #     user = User.query.get(user_id)
#     if user is None:
#         return jsonify({"message": "User not found", "response":False}), 404
    
#     topic = Topic.query.filter_by(topic_name=domain.lower()).first()
#     if topic is None:
#         topic = Topic(topic_name=domain.lower())
#         db.session.add(topic)
#         db.session.commit()

#     module = Module.query.filter_by(module_name=module_name, topic_id=topic.topic_id, level='trending', websearch=True).first()
#     if module is not None:
#         trans_submodule_content = translate_submodule_content(module.submodule_content, source_lang)
#         print(f"Translated submodule content: {trans_submodule_content}")
#         return jsonify({"message": "Query successful", "images": module.image_urls, "content": trans_submodule_content, "response": True}), 200
    
#     # add module to database
#     new_module = Module(module_name=module_name, topic_id=topic.topic_id, level='trending', websearch=True, summary=summary)
#     db.session.add(new_module)
#     db.session.commit()

#     images = module_image_from_web(module.module_name)
#     with ThreadPoolExecutor() as executor:
#         submodules = generate_submodules_from_web(module.module_name,module.summary)
#         print(submodules)
#         keys_list = list(submodules.keys())
#         submodules_split_one = {key: submodules[key] for key in keys_list[:3]}
#         submodules_split_two = {key: submodules[key] for key in keys_list[3:]}
#         future_content_one = executor.submit(generate_content_from_web, submodules_split_one, 'first')
#         future_content_two = executor.submit(generate_content_from_web, submodules_split_two, 'second')

#         content_one = future_content_one.result()
#         content_two = future_content_two.result()

#         content = content_one + content_two 

#         module.submodule_content = content
#         module.image_urls = images
#         db.session.commit()

#         # translate submodule content to the source language
#         trans_submodule_content = translate_submodule_content(content, source_lang)
#         print(f"Translated submodule content: {trans_submodule_content}")

#         return jsonify({"message": "Query successful", "images": module.image_urls, "content": trans_submodule_content, "response": True}), 200

@students.route('/projects',methods=["POST"])
@cross_origin(supports_credentials=True)
def get_projects_list():
    user_id = session.get('user_id')
    print(session.get('user_id'))
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    projects = list(ProjectsStudent.query.filter_by(github_id=user.github_id))
    serialized_projects = []
    for project in projects:
        serialized_projects.append({
            "id": project.id,
            "project_name": project.project_name,
            "github_id": project.github_id,
            "owner_id":project.owner_id
        })
    
    return jsonify({
        "message": "Query successful", 
        "projects": serialized_projects,
        "response": True
    }), 200
    
@students.route('/projects/<string:projectname>',methods=["POST"])
@cross_origin(supports_credentials=True)
def get_project(projectname):
    user_id = session.get('user_id')
    print(session.get('user_id'))
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    owner = ProjectsStudent.query.filter_by(github_id=user.github_id, project_name=projectname).first()
    print(user.github_id)
    return jsonify({"message": "Query successful", "project":projectname,"github_id":owner.owner_id,"github_PAT":user.github_PAT, "response": True}), 200

@students.route('/create_project', methods=['POST'])

@cross_origin(supports_credentials=True)
def create_project():
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    data = request.json
    project_name = data.get("project_name")
    teachers_list = data.get("teachers_list",[])
    students_list = data.get("students_list",[])

    
    if not project_name:
        return jsonify({"message": "Project name is required", "response": False}), 400
    current_user_github_id = user.github_id
    print(current_user_github_id)
    new_project = ProjectsStudent(
            project_name=project_name,
            github_id=user.github_id,
            owner_id=user.github_id
        )
    db.session.add(new_project)
    db.session.commit()
        
    
    
    for student_github_id in students_list:
        user = User.query.get(github_id=student_github_id)
        if not user :
            return jsonify({"message": "Student not found", "response": False}), 400
        new_project_student = ProjectsStudent(
            project_name=project_name,
            github_id=student_github_id,
            owner_id=user.github_id
        )
        db.session.add(new_project_student)
        db.session.commit()
        
    for teacher_github_id in teachers_list:
        print(teacher_github_id,teachers_collection.find())
        teacher = teachers_collection.find_one({"github_id": teacher_github_id})

        if teacher :
   
            new_project_teacher = {
                "project_name":project_name,
                "github_id":teacher_github_id,
                "owner_id":user.github_id
            }

            projects_collection.insert_one(new_project_teacher)
        else:
            return jsonify({"message": "Incorrect teacher github name", "response": False}), 400

    
    return jsonify({"message": "Project created successfully", "github_id":current_user_github_id ,"github_PAT":user.github_PAT,"response": True}), 201
    

@students.route('/query2/doc-upload/<string:topicname>/<string:level>/<string:source_lang>',methods=['POST'])
def doc_query_topic(topicname,level,source_lang):
    user_id = session.get('user_id')
    print(session.get('user_id'))
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    websearch ='false'
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    uploads_path = os.path.join('server', 'uploads')
    if file.filename == '':
        return 'No selected file', 400
    if not os.path.exists(uploads_path):
        os.makedirs(uploads_path)
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(uploads_path, filename))
    
    docs_path = os.path.join(uploads_path, filename)
    loader = PyPDFLoader(docs_path)
    docs = loader.load()
    docs_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=150)
    split_docs = docs_splitter.split_documents(docs)
    TEXTBOOK_VECTORSTORE = FAISS.from_documents(split_docs, EMBEDDINGS)
    TEXTBOOK_VECTORSTORE.save_local('teacher_docs')
    print('CREATED VECTORSTORE')
    VECTORDB_TEXTBOOK = FAISS.load_local('teacher_docs', EMBEDDINGS, allow_dangerous_deserialization=True)

    if source_lang == 'auto':
        source_language = ServerUtils.detect_source_language(topicname)
        print(f"Source Language: {source_language}")
    else:
        source_language=source_lang
        print(f"Source Language: {source_language}")

    trans_topic_name = GoogleTranslator(source='auto', target='en').translate(topicname)
    print(f"Translated topic name: {trans_topic_name}")

    topic = Topic.query.filter_by(topic_name=trans_topic_name.lower()).first()
    if topic is None:
            topic = Topic(topic_name=trans_topic_name.lower())
            db.session.add(topic)
            db.session.commit()
            print(f"topic added to database: {topic}")

    
    module_summary_content = SUB_MODULE_GENERATOR.generate_submodules_from_textbook(trans_topic_name,level,VECTORDB_TEXTBOOK)    
    print("Content",module_summary_content)
    module_ids = {}
    for modulename, modulesummary in module_summary_content.items():
        new_module = Module(
            module_name=modulename,
            topic_id=topic.topic_id,
            websearch=websearch,
            level=level,
            summary=modulesummary
        )
        db.session.add(new_module)
        db.session.commit()
        module_ids[modulename] = new_module.module_id

    # add user query to database
    new_user_query = Query(user_id=user.user_id, topic_id=topic.topic_id, level=level, websearch=websearch, lang=source_language)
    db.session.add(new_user_query)
    db.session.commit()

    trans_moduleids = {}
    if source_language !='english':
        for key, value in module_ids.items():
            trans_key = GoogleTranslator(source='en', target=source_language).translate(str(key))
            trans_moduleids[trans_key]=value
        module_ids=trans_moduleids
    trans_module_summary_content = ServerUtils.translate_module_summary(module_summary_content, source_language)

    return jsonify({"message": "Query successful", "topic_id":topic.topic_id, "topic":trans_topic_name, "source_language":source_language, "module_ids":module_ids, "content": trans_module_summary_content, "response":True}), 200

@students.route('/query2/doc_generate_content',methods=['GET'])
def personalized_module_content():
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response": False}), 404
    source_language ="en"
    characters = string.ascii_letters + string.digits  # Alphanumeric characters
    key = ''.join(secrets.choice(characters) for _ in range(7))
    title=session['title']
    topic=session['topic']
    description=session['user_profile']
    VECTORDB_TEXTBOOK = FAISS.load_local(USER_DOCS_PATH, EMBEDDINGS, allow_dangerous_deserialization=True)
    # new_module = PersonalizedModule(
    #     module_code=key,
    #     module_name=modulename,
    #     summary=modulesummary
    # )
    # db.session.add(new_module)
    # db.session.commit()
    # check if submodules are saved in the database for the given module_id
    print("language",source_language)
    with ThreadPoolExecutor() as executor:
        submodules = session['submodules']
        keys_list = list(submodules.keys())
        future_images_list = executor.submit(SerperProvider.module_image_from_web, submodules)
        # future_video_list = executor.submit(SerperProvider.module_videos_from_web, submodules)
        submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
        submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
        submodules_split_three = {key: submodules[key] for key in keys_list[4:]}
        future_content_one = executor.submit(CONTENT_GENERATOR.generate_content_from_textbook,topic,title ,submodules_split_one,description,VECTORDB_TEXTBOOK,'first')
        future_content_two = executor.submit(CONTENT_GENERATOR.generate_content_from_textbook,topic,title ,submodules_split_two,description,VECTORDB_TEXTBOOK,'second')
        future_content_three = executor.submit(CONTENT_GENERATOR.generate_content_from_textbook,topic,title ,submodules_split_three,description,VECTORDB_TEXTBOOK,'third')

    # Retrieve the results when both functions are done
    content_one = future_content_one.result()
    content_two = future_content_two.result()
    content_three = future_content_three.result()

    content = content_one + content_two + content_three
    images_list = future_images_list.result()
    # video_list = future_video_list.result()

    # new_module.submodule_content = content
    # new_module.image_urls = images_list
    # new_module.video_urls = video_list
    # db.session.commit()

    # add module to ongoing modules for user
    # ongoing_module = PersonalizedOngoingModule(user_id=user.user_id, module_id=new_module.module_id)
    # db.session.add(ongoing_module)
    # db.session.commit()
    # translate submodule content to the source language
    trans_submodule_content = ServerUtils.translate_submodule_content(content, source_language)
    
    return jsonify({"message": "Query successful", "images": images_list,"content": trans_submodule_content, "response": True}), 200

# query route --> if websearch is true then fetch from web and feed into model else directly feed into model
# save frequently searched queries in database for faster retrieval
@students.route('/query2/<string:topicname>/<string:level>/<string:websearch>/<string:source_lang>', methods=['GET'])
@cross_origin(supports_credentials=True)
def query_topic(topicname,level,websearch,source_lang):
    user_id = session.get('user_id')
    print(session.get('user_id'))
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404

    if source_lang == 'auto':
        source_language = ServerUtils.detect_source_language(topicname)
        print(f"Source Language: {source_language}")
    else:
        source_language=source_lang
        print(f"Source Language: {source_language}")

    trans_topic_name = ""
    if source_lang!="english":
        trans_topic_name = GoogleTranslator(source=source_lang, target='en').translate(topicname)
        print(f"Translated topic name: {trans_topic_name}")
    else:
        trans_topic_name = topicname
    topic = Topic.query.filter_by(topic_name=trans_topic_name.lower()).first()
    session['topic']=trans_topic_name
    if topic is None:
            topic = Topic(topic_name=trans_topic_name.lower())
            db.session.add(topic)
            db.session.commit()
            print(f"topic added to database: {topic}")
    else:
        modules = Module.query.filter_by(topic_id=topic.topic_id, websearch=websearch, level=level).all()
        if modules:
            module_ids = {module.module_name:module.module_id for module in modules}
            module_summary_content = {module.module_name:module.summary for module in modules}
            trans_module_summary_content = ServerUtils.translate_module_summary(module_summary_content, source_language)
            print(f"Translated module summary content: {trans_module_summary_content}")
            trans_moduleids = {}
            if source_language !='english':
                for key, value in module_ids.items():
                    trans_key = GoogleTranslator(source='en', target=source_language).translate(str(key))
                    trans_moduleids[trans_key]=value
                module_ids=trans_moduleids
            return jsonify({"message": "Query successful", "topic_id":topic.topic_id, "topic":trans_topic_name, "source_language":source_language, "module_ids":module_ids, "content": trans_module_summary_content, "response":True}), 200


    if(websearch=="true"):
        print("web search true:-")
        module_summary_content = MODULE_GENERATOR.generate_module_summary_from_web(topic=trans_topic_name,level=level)
    else:    
        print("web search false:-")
        module_summary_content = MODULE_GENERATOR.generate_module_summary(topic=trans_topic_name,level=level)    
    
    module_ids = {}
    for modulename, modulesummary in module_summary_content.items():
        new_module = Module(
            module_name=modulename,
            topic_id=topic.topic_id,
            websearch=websearch,
            level=level,
            summary=modulesummary
        )
        db.session.add(new_module)
        db.session.commit()
        module_ids[modulename] = new_module.module_id

    new_user_query = Query(user_id=user.user_id, topic_id=topic.topic_id, level=level, websearch=websearch, lang=source_language)
    db.session.add(new_user_query)
    db.session.commit()

    trans_moduleids = {}
    if source_language !='english':
        for key, value in module_ids.items():
            trans_key = GoogleTranslator(source='en', target=source_language).translate(str(key))
            trans_moduleids[trans_key]=value
        module_ids=trans_moduleids
    trans_module_summary_content = ServerUtils.translate_module_summary(module_summary_content, source_language)
    print(f"Translated module summary content: {trans_module_summary_content}")

    return jsonify({"message": "Query successful", "topic_id":topic.topic_id, "topic":trans_topic_name, "source_language":source_language, "module_ids":module_ids, "content": trans_module_summary_content, "response":True}), 200

#course overview route
@students.route('/query2/course-overview/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def course_overview(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response": False}), 404
    session["module_id"] = module_id
    topic = session.get("topic")
    module = Module.query.get(module_id)
    other_modules = Module.query.filter(Module.topic_id == module.topic_id,Module.level==module.level,Module.websearch==module.websearch, Module.module_id != module_id).all()
    modules_dict_list = [module.to_dict() for module in other_modules]
    module_info = {}
    module_info['module_name']=module.module_name
    module_info['summary']=module.summary
    module_info['level']=module.level

    if module.submodule_content is not None:
        print("language",source_language)
        trans_submodule_content = ServerUtils.translate_submodule_content(module.submodule_content, source_language)
        return jsonify({"message": "Query successful","other_modules":modules_dict_list,"module": module_info ,"images": module.image_urls,"videos": module.video_urls, "content": trans_submodule_content, "response": True}), 200
    
    with ThreadPoolExecutor() as executor:
        if websearch == "true":
            submodules = SUB_MODULE_GENERATOR.generate_submodules_from_web(module.module_name,module.summary)
            print(submodules)
            keys_list = list(submodules.keys())
            future_images_list = executor.submit(SerperProvider.module_image_from_web, submodules)
            future_video_list = executor.submit(SerperProvider.module_videos_from_web, submodules)
            submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
            submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
            submodules_split_three = {key: submodules[key] for key in keys_list[4:]}
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content_from_web, submodules_split_one, module.module_name,topic, 'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content_from_web, submodules_split_two, module.module_name,topic, 'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content_from_web, submodules_split_three, module.module_name,topic, 'third')

        else:
            submodules = SUB_MODULE_GENERATOR.generate_submodules(module.module_name)
            print(submodules)
            keys_list = list(submodules.keys())
            future_images_list = executor.submit(SerperProvider.module_image_from_web, submodules)
            future_video_list = executor.submit(SerperProvider.module_videos_from_web, submodules)
            submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
            submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
            submodules_split_three = {key: submodules[key] for key in keys_list[4:]}
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_one, module.module_name,topic,'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_two, module.module_name,topic,'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_three, module.module_name,topic,'third')

    content_one = future_content_one.result()
    content_two = future_content_two.result()
    content_three = future_content_three.result()

    content = content_one + content_two + content_three
    images_list = future_images_list.result()
    video_list = future_video_list.result()

    module.submodule_content = content
    module.image_urls = images_list
    module.video_urls = video_list
    db.session.commit()

    ongoing_module = OngoingModule(user_id=user.user_id, module_id=module_id, level=module.level)
    db.session.add(ongoing_module)
    db.session.commit()

    trans_submodule_content = ServerUtils.translate_submodule_content(content, source_language)
    
    return jsonify({"message": "Query successful","other_modules": modules_dict_list,"module": module_info ,"images": module.image_urls,"videos": module.video_urls ,"content": trans_submodule_content,"sub_modules": submodules, "response": True}), 200


# module query --> generate mutlimodal content (with images) for submodules in a module
@students.route('/query2/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def query_module(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response": False}), 404
    session["module_id"] = module_id
    
    module = Module.query.get(module_id)
    ongoing_module = OngoingModule.query.filter(OngoingModule.user_id==user.user_id, OngoingModule.module_id==module_id)
    if not ongoing_module:
        ongoing_modules = OngoingModule(user_id=user.user_id, module_id=module_id, level=module.level)
        db.session.add(ongoing_modules)
        db.session.commit()
    if module.submodule_content is not None:
        trans_submodule_content = ServerUtils.translate_submodule_content(module.submodule_content, source_language)
    return jsonify({"message": "Query successful", "images": module.image_urls,"videos": module.video_urls, "content": trans_submodule_content, "response": True}), 200
    

# download route --> generate pdf for module summary and module content
# currently generate pdf for latin and devanagari scripts 
@students.route('/query2/test', methods=['GET'])
def test():
    ongoing_module = OngoingModule(user_id=2, module_id=78, level='beginner')
    db.session.add(ongoing_module)
    db.session.commit()
    return jsonify({"message": "Query successful"})

@students.route('/query2/<int:module_id>/<string:source_language>/download', methods=['GET'])
def download_pdf(module_id, source_language):
    module = Module.query.get(module_id)
    modulename = module.module_name
    clean_modulename = modulename.replace(':',"_") 
    module_summary = module.summary
    submodule_content = module.submodule_content

    trans_modulename = GoogleTranslator(source='en', target=source_language).translate(modulename)
    trans_module_summary = GoogleTranslator(source='en', target=source_language).translate(module_summary)
    trans_submodule_content = ServerUtils.translate_submodule_content(submodule_content, source_language)

    download_dir = os.path.join(os.getcwd(), "server", "downloads")
    os.makedirs(download_dir, exist_ok=True)
    pdf_file_path = os.path.join(download_dir, f"{clean_modulename}_summary.pdf")
    PDF_GENERATOR.generate_pdf(pdf_file_path, trans_modulename, trans_module_summary, trans_submodule_content, source_language, module.video_urls)
    return send_file(pdf_file_path, as_attachment=True)

@students.route('/generate-audio', methods=['POST'])
@cross_origin(supports_credentials=True)
def generate_audio():
    data = request.json
    content = data.get('content')
    language = data.get('language') 
    subject_title = data.get('subject_title') 
    subject_content = data.get('subject_content') 

    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    full_text = ""
    full_text += f"{subject_title}. {subject_content}. "
    for item in content:
        full_text += f"{item['title']}. {item['content']}. "
    tts = gTTS(text=full_text, lang=language, slow=False)
    audio_file = BytesIO()
    tts.write_to_fp(audio_file)
    audio_file.seek(0)
    # file_path=text_to_speech(trans_output, language=source_lang, directory='audio_files')
    return send_file(audio_file, mimetype='audio/mp3', as_attachment=True, download_name='generated_audio.mp3')



@students.route('/quiz/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def gen_quiz(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    module = Module.query.get(module_id)
    sub_module_names = [submodule['title_for_the_content'] for submodule in module.submodule_content]
    print("Submodules:-----------------------",sub_module_names)

    if websearch=="true":
        print("WEB SEARCH OP quiz1--------------------------")
        quiz = QUIZ_GENERATOR.generate_quiz_from_web(sub_module_names)
    else:
        quiz = QUIZ_GENERATOR.generate_quiz(sub_module_names)
    translated_quiz = ServerUtils.translate_quiz(quiz["quizData"], source_language)
    return jsonify({"message": "Query successful", "quiz": translated_quiz, "response": True}), 200

@students.route('/quiz2/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def gen_quiz2(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    module = Module.query.get(module_id)

    # check if user has completed quiz1 or not
    # completed_module = CompletedModule.query.filter_by(user_id=user_id, module_id=module_id, level=module.level).first()
    # if completed_module.theory_quiz_score is None:
    #     return jsonify({"message": "User has not completed quiz1", "response":False}), 404
    
    sub_module_names = [submodule['title_for_the_content'] for submodule in module.submodule_content]
    print("Submodules:-----------------------",sub_module_names)
    if websearch=="true":
        print("WEB SEARCH OP quiz2--------------------------")
        quiz = QUIZ_GENERATOR.generate_applied_quiz_from_web(sub_module_names)
    else:
        quiz = QUIZ_GENERATOR.generate_applied_quiz(sub_module_names)

    translated_quiz = ServerUtils.translate_quiz(quiz["quizData"], source_language)
    print("quiz---------------",quiz)
    return jsonify({"message": "Query successful", "quiz": translated_quiz, "response": True}), 200

@students.route('/quiz3/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def gen_quiz3(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    module = Module.query.get(module_id)

    # check if user has completed quiz1 or not
    # completed_module = CompletedModule.query.filter_by(user_id=user_id, module_id=module_id, level=module.level).first()
    # if completed_module.theory_quiz_score is None:
    #     return jsonify({"message": "User has not completed quiz1", "response":False}), 404
    
    sub_module_names = [submodule['subject_name'] for submodule in module.submodule_content]
    print("Submodules:-----------------------",sub_module_names)
    if websearch=="true":
        print("WEB SEARCH OP quiz2=3--------------------------")
        quiz = QUIZ_GENERATOR.generate_conversation_quiz_from_web(sub_module_names)
    else:
        quiz = QUIZ_GENERATOR.generate_conversation_quiz(sub_module_names)

    translated_questions = ServerUtils.translate_assignment(quiz, source_language)
    print("quiz---------------",quiz)
    return jsonify({"message": "Query successful", "quiz": translated_questions, "response": True}), 200


@students.route('/add_theory_score/<int:score>')
@cross_origin(supports_credentials=True)
def add_theory_score(score):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    module_id = session.get("module_id", None)
    module = Module.query.get(module_id)
    completed_module = CompletedModule(user_id=user_id, module_id=module_id, level=module.level, theory_quiz_score=score)
    db.session.add(completed_module)
    db.session.commit()
    return jsonify({"message": "Score added successfully", "response": True}), 200

@students.route('/add_application_score/<int:score>')
@cross_origin(supports_credentials=True)
def add_application_score(score):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    module_id = session.get("module_id", None)
    module = Module.query.get(module_id)
    completed_module = CompletedModule.query.filter_by(user_id=user_id, module_id=module_id, level=module.level).first()
    completed_module.application_quiz_score = score
    db.session.commit()
    return jsonify({"message": "Score added successfully", "response": True}), 200

@students.route('/add_assignment_score',methods=['POST'])
@cross_origin(supports_credentials=True)
def add_assignment_score():
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404

    request_data = request.get_json()
    module_id = session.get("module_id", None)
    score = request_data.get('evaluationResponse')
    module = Module.query.get(module_id)
    completed_module = CompletedModule.query.filter_by(user_id=user_id, module_id=module_id, level=module.level).first()
    completed_module.assignment_score = score
    db.session.commit()

    ongoing_module = OngoingModule.query.filter_by(user_id=user_id, module_id=module_id).first()
    if ongoing_module:
        db.session.delete(ongoing_module)
        db.session.commit()

    return jsonify({"message": "Score added successfully", "response": True}), 200

@students.route('/chatbot-route', methods=['POST'])
@cross_origin(supports_credentials=True)
def chatbot_route():
    data = request.get_json()
    print(data)
    tool_check = []
    query = data.get('userdata', '')
    if data.get('index_no', ''):
        index = int(data.get('index_no', ''))
        session['index_chatbot'] = index

    if query:
        source_language = ServerUtils.detect_source_language(query)
        if source_language != 'english':
            trans_query = GoogleTranslator(source=source_language, target='english').translate(query)
        else:
            trans_query = query
        print(trans_query)
        chat = GEMINI_CLIENT.return_chat()
        response = chat.send_message(trans_query)
        print(response)
        response_text = response.text  # Assuming response.text is a string
        
        if source_language != 'english':
            trans_output = GoogleTranslator(source='auto', target=source_language).translate(response_text)
        else:
            trans_output = response_text
        
        return jsonify({'chatbotResponse': trans_output, 'function_name': 'normal_search'})
    
    else:
        return jsonify({'error': 'User message not provided'}), 400
    
        # if run.status == 'failed':
        #     print(run.error)
        # elif run.status == 'requires_action':
        #     run = GEMINI_CLIENT.submit_tool_outputs(thread_id, run.id, run.required_action.submit_tool_outputs.tool_calls, AVAILABLE_TOOLS)
            
    #     messages = GEMINI_CLIENT.list_assistant_messages(thread_id=thread_id)
    #     print('message',messages)
    #     content = None
    #     for thread_message in messages.data:
    #         content = thread_message.content
    #     print("Content List", content)
    #     if len(tool_check) == 0:
    #         chatbot_reply = content[0].text.value
    #         print("Chatbot reply",chatbot_reply)
    #         if source_language != 'english':
    #             trans_output = GoogleTranslator(source='auto', target=source_language).translate(chatbot_reply)
    #         else:
    #             trans_output = chatbot_reply
    #         response = {'chatbotResponse': trans_output,'function_name': 'normal_search'}
    #     return jsonify(response)
    # else:
    #     return jsonify({'error': 'User message not provided'}), 400
    
@students.route('/query2/voice-save', methods=['POST'])
@cross_origin(supports_credentials=True)
def save_voices():
    try:
        user_id = session.get("user_id", None)
        module_id = session.get("module_id", None)
        if user_id is None:
            return jsonify({"message": "User not logged in", "response": False}), 401

        user = User.query.get(user_id)
        if user is None:
            return jsonify({"message": "User not found", "response": False}), 404
        print("Module id:-----------", module_id)

        # Create a folder to store the voice recordings if it doesn't exist
        base_folder = os.path.join('voice_recordings', str(user_id), str(module_id))
        os.makedirs(base_folder, exist_ok=True)

        # Check if the post request has the file part
        if 'voice' not in request.files:
            return jsonify({"message": "No file part in the request", "response": False}), 400

        # Get the voice file
        voice = request.files['voice']

        # Save the voice recording as a WAV file
        filename = f'voice_{datetime.now().strftime("%Y%m%d%H%M%S")}.wav'
        file_path = os.path.join(base_folder, secure_filename(filename))
        voice.save(file_path)

        return jsonify({'message': 'Voice saved successfully', 'response': True}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'response': False}), 500
    
@students.route('/evaluate_quiz/<string:source_language>', methods=['POST'])
@cross_origin(supports_credentials=True)
def evaluate_quiz(source_language):
    try:
        user_id = session.get("user_id", None)
        module_id = session.get("module_id", None)
        if user_id is None:
            return jsonify({"message": "User not logged in", "response": False}), 401
        user = User.query.get(user_id)
        if user is None:
            return jsonify({"message": "User not found", "response": False}), 404
        # Get the responses from the request data
        responses = request.json.get('responses')
        print("responses",responses)
        translated_responses_output =  ServerUtils.translate_responses(responses,source_language)
        # Perform evaluation logic (replace this with your actual evaluation logic)
        evaluation_result = EVALUATOR.evaluate_conversation_quiz(translated_responses_output)
        translate_evaluation_result = ServerUtils.translate_evaluations(evaluation_result,source_language)
        # evaluation_result = {
        #     "accuracy": 7,
        #     "completeness": 6,
        #     "clarity": 8,
        #     "relevance": 9,
        #     "understanding": 8,
        #     "feedback": "Overall, your answers demonstrate a good understanding of machine learning concepts and their applications. However, there are some areas for improvement. In the first question, the answer lacks specific examples of real-world scenarios where machine learning is applied. For the second question, while the explanation of supervised and unsupervised learning is accurate, examples of each are missing. The answer to the third question is accurate, but could benefit from more detailed explanation and specific examples. The answer to the fourth question is comprehensive and relevant. In the fifth question, the answer could be improved by providing more examples and elaborating further on the impact of feature selection and engineering on model performance. Overall, your responses are clear and well-organized, but adding specific examples and more detailed explanations would further enhance the completeness and understanding of your answers."
        # }
        return jsonify(translate_evaluation_result), 200
    except Exception as e:
        print(f"Error during evaluation: {str(e)}")
        return jsonify({"error": "An error occurred during evaluation"}), 500
    
@students.route('/delete-info', methods=['GET'])
@cross_origin(supports_credentials=True)
def delete_info():
    module_id = session.get("module_id", None)
    user_id = session.get("user_id", None)
    ongoing_module = OngoingModule.query.filter_by(user_id=user_id, module_id=module_id).first()
    if ongoing_module:
        db.session.delete(ongoing_module)
        db.session.commit()
    module = Module.query.filter_by(module_id=module_id).first()
    if module:
        db.session.delete(module)
        db.session.commit()
    return jsonify({"message": "An error occurred during evaluation"}), 200

@students.route('/fetch-shared-course', methods=['POST'])
def fetch_shared_courses():
    course_code = request.json.get("course_code")
    course = courses_collection.find_one({"course_code": course_code})
    
    if not course:
        return jsonify({"message": "No course found for the given code", "response": False}), 404
    teacher_id = course.get('teacher_id')
    teacher = teachers_collection.find_one({"_id": ObjectId(teacher_id)})
    teacher_first_name = teacher['first_name'] if teacher else 'Unknown'
    teacher_last_name = teacher['last_name'] if teacher else 'Unknown'

    course_data = {
        'id': str(course['_id']),
        'course_name': course.get('course_name'),
        'teacher_name': teacher_first_name + " " + teacher_last_name,
        'num_of_lectures': course.get('num_of_lectures'),
        'course_code': course.get('course_code'),
        'lessons_data': course.get('lessons_data'),
    }
    return jsonify({"courses": course_data, "response": True}), 200

@students.route('/fetch-shared-lessons', methods=['POST'])
def fetch_shared_lessons():
    user_id = session.get('user_id')
    data = request.json
    course_id = data.get('course_id')
    
    if user_id is None:
        return jsonify({"message": "User not logged in.", "response": False}), 401

    if course_id is None:
        return jsonify({"message": "Course ID not found in the request.", "response": False}), 400

    course = courses_collection.find_one({"_id": ObjectId(course_id)})

    if course is None:
        return jsonify({"message": "Course not found for this teacher."}), 404

    lessons_data : dict = json.loads(course.get("lessons_data", "{}"))
    lesson_statuses = []
    lesson_ids = []

    for lesson_title in lessons_data.keys():
        existing_lesson = lessons_collection.find_one({"title": lesson_title, "course_id": course_id})
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

@students.route('/create-lab-manual-docx', methods=['POST'])
def convert_docx():
    user_id = session.get('user_id')
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401

    try:
        data = request.json
        lab_manual_id = data.get('lab_manual_id')
        if not lab_manual_id:
            return jsonify({"message": "Lab manual ID is required", "response": False}), 400

        from bson import ObjectId
        if not ObjectId.is_valid(lab_manual_id):
            return jsonify({"message": "Invalid lab manual ID", "response": False}), 400
        
        lab_manual = lab_manuals_collection.find_one(
            {"_id": ObjectId(lab_manual_id)}
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
        doc = LabManualGenerator.convert_markdown_to_docx(markdown, course_name, exp_num)

        return send_file(
            doc,
            as_attachment=True,
            download_name=f"{course_name}_{exp_num}.docx",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        print("An error occurred while creating the document:", e)
        return jsonify({"message": "Failed to create document", "response": False}), 500



#-----------------------CODE DIV---------------------



assignments_collection = mongodb["assignments"]
from core.code_div import ass_eval
import tempfile

# 2. Fetch All Assignments (Teacher & Student)
@students.route('/fetch-assignments', methods=['GET'])
def fetch_assignments():
    assignments = list(assignments_collection.find({}, {"_id": 0}))
    return jsonify({"assignments": assignments})


# 5. Submit Assignment (Student Side)
@students.route('/submit-assignment', methods=['POST'])
def submit_assignment():
    """
    Student submits their assignment by uploading a PDF.
    The student must provide the assignment_id, and the backend uses that to fetch assignment details.
    """
    if 'doc' not in request.files:
        return jsonify({"error": "No document uploaded."}), 400

    doc_file = request.files['doc']
    student_id = request.form.get("student_id", "")
    assignment_id = request.form.get("assignment_id", "")

    if not assignment_id:
        return jsonify({"error": "Assignment ID is required"}), 400

    # Lookup the assignment by assignment_id
    assignment = assignments_collection.find_one({"assignment_id": assignment_id})
    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    subject_name = assignment["subject_name"]
    assignment_details = assignment["details"]

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        doc_file.save(tmp)
        tmp_path = tmp.name

    # Evaluate the submission using the AI evaluation function
    result = ass_eval(subject_name, assignment_details, tmp_path)
    try:
        evaluation_details = json.loads(result)
    except Exception:
        evaluation_details = {"error": "Invalid evaluation format", "raw_result": result}

    # Build evaluation entry
    evaluation_entry = {
        "student_id": student_id,
        "marks": evaluation_details.get("marks", []),
        "justification": evaluation_details.get("Justification", []),
        "total_marks_obtained": evaluation_details.get("total_marks", 0),
        "submitted_at": datetime.utcnow()
    }

    update_result = assignments_collection.update_one(
        {"assignment_id": assignment_id},
        {"$push": {"evaluations": evaluation_entry}}
    )

    if update_result.matched_count == 0:
        return jsonify({"error": "Assignment not found"}), 404

    return jsonify({
        "message": "Assignment submitted and evaluated successfully",
        "evaluation": evaluation_entry
    })

    
# Add these helper functions in the students blueprint
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

# Add these routes to the students blueprint
@students.route('/chats', methods=['POST'])
# @cross_origin(supports_credentials=True)
def student_access_chat():
    user_id = session.get("user_id", None)
    return access_chat(request, mongodb, is_teacher=False, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=user_id)

@students.route('/chats', methods=['GET'])
# @cross_origin(supports_credentials=True)
def student_fetch_chats():
    print("-" * 20) # Separator for clarity
    print(f"FLASK /chats - Incoming Request Headers: {request.headers}") # Print all headers
    print(f"FLASK /chats - Incoming Cookies: {request.cookies}") # Print parsed cookies
    print(f"FLASK /chats - Session BEFORE access: {dict(session)}") 
    user_id = session.get("user_id", None)
    # print("OOOOOOOOO",user_id)
    print("SET222",session.get("user_id"))
    return fetch_chats(mongodb, is_teacher=False, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=user_id)

@students.route('/chats/group', methods=['POST'])
@cross_origin(supports_credentials=True)
def student_create_group_chat():
    user_id = session.get("user_id", None)
    return create_group_chat(request, mongodb, is_teacher=False, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=user_id)

@students.route('/chats/rename', methods=['PUT'])
@cross_origin(supports_credentials=True)
def student_rename_group():
    user_id = session.get("user_id", None)
    return rename_group(request, mongodb, is_teacher=False,current_user_id=user_id)

@students.route('/chats/groupadd', methods=['PUT'])
@cross_origin(supports_credentials=True)
def student_add_to_group():
    user_id = session.get("user_id", None)
    return add_to_group(request, mongodb, is_teacher=False,current_user_id=user_id)

@students.route('/chats/groupremove', methods=['PUT'])
@cross_origin(supports_credentials=True)
def student_remove_from_group():
    user_id = session.get("user_id", None)
    return remove_from_group(request, mongodb, is_teacher=False,current_user_id=user_id)

@students.route('/messages', methods=['POST'])
@cross_origin(supports_credentials=True)
def student_send_message():
    user_id = session.get("user_id", None)
    return send_message(request, mongodb, is_teacher=False, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=user_id)

@students.route('/messages/<chat_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
def student_all_messages(chat_id):
    user_id = session.get("user_id", None)
    return all_messages(chat_id, mongodb, is_teacher=False, get_teacher_func=get_teacher_by_id, get_student_func=get_student_by_id,current_user_id=user_id)

# Add a route for searching users (teachers and students) for chat
@students.route('/users/search', methods=['GET'])
@cross_origin(supports_credentials=True)
def search_users():
    search_query = request.args.get('search', '')
    if not search_query:
        return jsonify([]), 200
    
    # Get current teacher ID
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Not logged in"}), 401
    
    # Search for teachers
    teacher_results = list(teachers_collection.find({
        "$and": [
            # {"_id": {"$ne": ObjectId(teacher_id)}},
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
        ).filter(
            # Add the new AND condition to exclude the current user
            User.user_id != user_id
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
    
    
    
# -------------------Research paper-------------------------

from core.code_div import *


research_collection = mongodb["student_research"]
from bson import ObjectId

@students.route('/research', methods=['POST'])
def research_papers_endpoint():
    student_id = session.get('user_id')  # Get student_id from session
    data = request.json
    
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
    
    query = data['query']
    max_papers = data.get('max_papers', 5)
    days_back = data.get('days_back', 365)
    
    results = search_and_summarize_papers(
        query=query,
        max_papers=max_papers,
        days_back=days_back
    )
    
    # Add student_id to results before saving to MongoDB
    results["student_id"] = student_id

    # Insert into MongoDB
    insert_result = research_collection.insert_one(results)

    # Convert ObjectId to string for JSON serialization
    results["_id"] = str(insert_result.inserted_id)

    return jsonify(results)




@students.route('/fetch-papers', methods=['GET'])
def get_grouped_research_papers():
    student_id = session.get('user_id')  # Get the logged-in teacher's ID

    if not student_id:
        return jsonify({"error": "Unauthorized access"}), 403  # Ensure teacher is logged in

    # Aggregation pipeline to group papers by 'query'
    pipeline = [
        {"$match": {"student_id": student_id}},  # Filter by Student
        {"$unwind": "$papers"},  # Flatten the papers array
        {"$group": {
            "_id": "$query",  # Group by query
            "timestamp": {"$first": "$timestamp"},
            "success": {"$first": "$success"},
            "count": {"$sum": 1},  # Count number of papers in the group
            "papers": {"$push": {
                "_id": {"$toString": "$papers._id"},  # Convert ObjectId to string
                "title": "$papers.title",
                "authors": "$papers.authors",
                "year": "$papers.year",
                "url": "$papers.url",
                "abstract": "$papers.abstract",
                "summary": "$papers.summary",
                "citations": "$papers.citations",
                "venue": "$papers.venue"
            }}
        }},
        {"$sort": {"timestamp": -1}}  # Sort by latest query timestamp
    ]

    grouped_papers = list(research_collection.aggregate(pipeline))

    return jsonify(grouped_papers)