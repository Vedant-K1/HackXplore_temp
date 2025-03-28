import os
import string
import secrets
from io import BytesIO
from server import db, bcrypt
from datetime import datetime
from gtts import gTTS
from sqlalchemy import desc
from deep_translator import GoogleTranslator
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from flask import request, session, jsonify, send_file, Blueprint
from models.student_schema import User, Topic, Module, CompletedModule, Query, OngoingModule, Transaction
from concurrent.futures import ThreadPoolExecutor
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, ScrapflyLoader
from langchain_community.document_loaders.merge import MergedDataLoader
import torch
from transformers import AutoImageProcessor, AutoModel, AutoTokenizer
from api.gemini_client import GeminiProvider
from api.serper_client import SerperProvider
from core.submodule_generator import SubModuleGenerator
from core.content_generator import ContentGenerator
from core.module_generator import ModuleGenerator
from core.quiz_generator import QuizGenerator
from core.pdf_generator import PdfGenerator
from core.evaluator import Evaluator
from core.recommendation_generator import RecommendationGenerator
from core.rag import MultiModalRAG
from server.utils import ServerUtils, AssistantUtils
import json

users = Blueprint(name='users', import_name=__name__)

DEVICE_TYPE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMAGE_EMBEDDING_MODEL_NAME = "openai/clip-vit-base-patch16"
CLIP_MODEL = AutoModel.from_pretrained(IMAGE_EMBEDDING_MODEL_NAME).to(DEVICE_TYPE)
CLIP_PROCESSOR = AutoImageProcessor.from_pretrained(IMAGE_EMBEDDING_MODEL_NAME)
CLIP_TOKENIZER = AutoTokenizer.from_pretrained(IMAGE_EMBEDDING_MODEL_NAME)
EMBEDDINGS = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
GEMINI_CLIENT = GeminiProvider()
TOOLS = [AssistantUtils.get_page_context]
MODULE_GENERATOR = ModuleGenerator()
SUB_MODULE_GENERATOR = SubModuleGenerator()
CONTENT_GENERATOR = ContentGenerator()
PDF_GENERATOR = PdfGenerator()
QUIZ_GENERATOR = QuizGenerator()
RECOMMENDATION_GENERATOR = RecommendationGenerator()
EVALUATOR = Evaluator()
USER_DOCS_PATH = os.path.join('server', 'user_docs')
AVAILABLE_TOOLS = {
    'get_context_from_page': AssistantUtils.get_page_context
}

@users.route('/register',methods=['POST'])
@cross_origin(supports_credentials=True)
def register():
    # take user input
    fname = request.form['firstName']  # Access the 'fname' variable from the JSON data
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
    # check if user has already registered by same email
    print("id of the colege------",request.form)
    user_exists = User.query.filter_by(email=email).first() is not None

    if user_exists:
        return jsonify({"message": "User already exists", "response":False}), 201
    
    # hash password, create new user save to database
    hash_pass = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(fname=fname, lname=lname, email=email, password=hash_pass, country=country, state=state, city=city, gender=gender, age=age, college_name=college_name, course_name=course_name, interests=interests, student_id=student_id_file.read())
    db.session.add(new_user)
    db.session.commit()

    response = jsonify({"message": "User created successfully", "id":new_user.user_id, "email":new_user.email, "response":True}), 200
    return response

# login route  --> add username to session and make it unique in user model
@users.route('/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    # check user is registered or not
    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"message": "Unregistered email id", "response":False}), 200
    
    # check password
    if not bcrypt.check_password_hash(user.password, password.encode('utf-8')):
        return jsonify({"message": "Incorrect password", "response":False}), 200
    
    # start user session
    session["user_id"] = user.user_id
    print("user id in session:-",session.get('user_id'))
    profile = f"This a profile of user, Name: {user.fname} {user.lname}, Email: {user.email}, Country: {user.country}, Age: {user.age}, Ongoing Course Name: {user.course_name}, User Interest: {user.interests}"
    print("Profile",profile)

    # create assistant for user
    assistant = GEMINI_CLIENT.initialize_assistant(profile= profile, tools=TOOLS)
    return jsonify({"message": "User logged in successfully", "email":user.email, "response":True}), 200



@users.route('/user_profile', methods=['GET', 'POST'])
@cross_origin(supports_credentials=True)
def user_profile():
    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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


@users.route('/user_dashboard', methods=['GET'])
@cross_origin(supports_credentials=True)
def getuser():
    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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
            

    print("ALL ON GOING MODULES", all_ongoing_modules_names)  
    query_message = ""
    user_queries = user.user_query_association 
    print("----------------------",user_queries)  
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

# logout route
@users.route('/logout', methods=['GET'])
@cross_origin(supports_credentials=True)
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "User logged out successfully", "response":True}), 200



# delete user route --> user dependent queries and completed topics will also be deleted no need to delete them separately
@users.route('/delete', methods=['DELETE'])
@cross_origin(supports_credentials=True)
def delete():
    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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


# @users.route('/query2/trending/<string:domain>', methods=['GET'])
# @cross_origin(supports_credentials=True)
# def trending_data(domain):
#     text=trending_module_summary_from_web(domain)
#     print(text)
#     return jsonify({"message": "Query successful", "domain": domain,  "content": text, "response":True}), 200


# @users.route('/query2/trending/<string:domain>/<string:module_name>/<string:summary>/<string:source_lang>', methods=['GET'])
# @cross_origin(supports_credentials=True)
# def trending_query(domain, module_name, summary, source_lang):
#     # check if user is logged in
#     user_id = session.get("user_id", None)
#     if user_id is None:
#         return jsonify({"message": "User not logged in", "response":False}), 401
    
#     # check if user exists
#     user = User.query.get(user_id)
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

@users.route('/query2/doc-upload/<string:topicname>/<string:level>/<string:source_lang>',methods=['POST'])
def doc_query_topic(topicname,level,source_lang):
    user_id = session.get('user_id')
    print(session.get('user_id'))
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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

    # language detection for input provided
    if source_lang == 'auto':
        source_language = ServerUtils.detect_source_language(topicname)
        print(f"Source Language: {source_language}")
    else:
        source_language=source_lang
        print(f"Source Language: {source_language}")

    # translate other languages input to english
    trans_topic_name = GoogleTranslator(source='auto', target='en').translate(topicname)
    print(f"Translated topic name: {trans_topic_name}")

    # check if topic exists in database along with its modulenames and summaries
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
    # translate module summary content to source language
    trans_module_summary_content = ServerUtils.translate_module_summary(module_summary_content, source_language)
    print(f"Translated module summary content: {trans_module_summary_content}")

    return jsonify({"message": "Query successful", "topic_id":topic.topic_id, "topic":trans_topic_name, "source_language":source_language, "module_ids":module_ids, "content": trans_module_summary_content, "response":True}), 200


@users.route('/query2/doc-upload',methods=['POST'])
def personalized_module():
    user_id = session.get('user_id')
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    if 'file' not in request.files:
        file=None
        # return 'No file part', 400
    else:
        file = request.files['file']
    # if file.filename == '':
    #     return 'No selected file', 400
    uploads_path = os.path.join('server', 'uploads')
    if not os.path.exists(uploads_path):
        os.makedirs(uploads_path)
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(uploads_path, filename))
    links = request.form.get('links')
    print("LINKS---------------------", links) 
    links_list = []
    if links:
        links_list = json.loads(links)
    print("LINKS LIST", links_list)
    title = request.form['title']
    description = request.form['description']
    session['user_profile']=description
    session['title']=title
    if file and len(links_list[0])>0:
        print("BOTH------------")
        DOCS_PATH = os.path.join(uploads_path, filename)
        scrapfly_scrape_config = {
            "asp": True,  # Bypass scraping blocking and antibot solutions, like Cloudflare
            "render_js": True,  # Enable JavaScript rendering with a cloud headless browser
            "proxy_pool": "public_residential_pool",  # Select a proxy pool (datacenter or residnetial)
            "country": "us",  # Select a proxy location
            "auto_scroll": True,  # Auto scroll the page
            "js": "",  # Execute custom JavaScript code by the headless browser
        }

        scrapfly_loader = ScrapflyLoader(
            links_list,
            api_key=os.getenv("SCRAPFLY_API_KEY"),  # Get your API key from https://www.scrapfly.io/
            continue_on_failure=True,  # Ignore unprocessable web pages and log their exceptions
            scrape_config=scrapfly_scrape_config,  # Pass the scrape_config object
            scrape_format="markdown",  # The scrape result format, either `markdown`(default) or `text`
        )
        pdf_loader = PyPDFLoader(DOCS_PATH)
        loader_all = MergedDataLoader(loaders=[scrapfly_loader, pdf_loader])
    elif file:
        DOCS_PATH = os.path.join(uploads_path, filename)
        print("FILE ONLY-------------------")
        loader_all = PyPDFLoader(DOCS_PATH)
    elif len(links_list[0])>0:
        print("LINKS ONLY--------------")
        scrapfly_scrape_config = {
            "asp": True,  # Bypass scraping blocking and antibot solutions, like Cloudflare
            "render_js": True,  # Enable JavaScript rendering with a cloud headless browser
            "proxy_pool": "public_residential_pool",  # Select a proxy pool (datacenter or residnetial)
            "country": "us",  # Select a proxy location
            "auto_scroll": True,  # Auto scroll the page
            "js": "",  # Execute custom JavaScript code by the headless browser
        }

        loader_all = ScrapflyLoader(
            links_list,
            api_key=os.getenv("SCRAPFLY_API_KEY"),  # Get your API key from https://www.scrapfly.io/
            continue_on_failure=True,  # Ignore unprocessable web pages and log their exceptions
            scrape_config=scrapfly_scrape_config,  # Pass the scrape_config object
            scrape_format="markdown",  # The scrape result format, either `markdown`(default) or `text`
        )

    docs = loader_all.load()
    docs_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = docs_splitter.split_documents(docs)
    TEXTBOOK_VECTORSTORE = FAISS.from_documents(split_docs, EMBEDDINGS)
    TEXTBOOK_VECTORSTORE.save_local(USER_DOCS_PATH)
    print('CREATED VECTORSTORE')
    VECTORDB_TEXTBOOK = FAISS.load_local(USER_DOCS_PATH, EMBEDDINGS, allow_dangerous_deserialization=True)
    submodules = SUB_MODULE_GENERATOR.generate_submodules_from_textbook(title,VECTORDB_TEXTBOOK)
    values_list = list(submodules.values())
    session['submodules']=submodules

    return jsonify({"message": "Query successful","submodules":values_list,"response":True}), 200

@users.route('/query2/multimodal-rag-submodules', methods=['POST'])
def multimodal_rag_submodules():
    # user_id = session.get('user_id')

    # if user_id is None:
    #     return jsonify({"message": "User not logged in", "response":False}), 401
    
    # user = User.query.get(user_id)
    # if user is None:
    #     return jsonify({"message": "User not found", "response":False}), 404

    if 'files[]' not in request.files:
        return jsonify({"message": "No files uploaded", "response": False}), 400
    
    title = request.form['title']
    if title=="":
        raise Exception("Title must be provided")
    description = request.form['description']
    files = request.files.getlist('files[]')
    current_dir = os.path.dirname(__file__)
    uploads_path = os.path.join(current_dir, 'uploaded-documents', title)
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

    if file and len(links_list[0])>0:
        print("\nInput: File + Links...\n")
        multimodal_rag = MultiModalRAG(
            course_name=title,
            documents_directory_path=uploads_path,  
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="pdf_and_link",
            links=links_list
        )
    elif file:
        print("\nInput: File only...\n")
        multimodal_rag = MultiModalRAG(
            course_name=title,
            documents_directory_path=uploads_path,  
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="pdf"
        )
    elif len(links_list[0])>0:
        print("\nInput: Links only..\n")
        multimodal_rag = MultiModalRAG(
            course_name=title,
            documents_directory_path=uploads_path,  
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            input_type="link",
            links=links_list
        )
    else:
        print("\nInput: None\n")
        submodules = SUB_MODULE_GENERATOR.generate_submodules(title)
        values_list = list(submodules.values())
        session['title'] = title
        session['user_profile'] = description
        session['submodules'] = submodules
        session['is_multimodal_rag'] = False
        print("\nGenerated Submodules:\n", submodules)
        return jsonify({"message": "Query successful", "submodules": values_list, "response": True}), 200

    text_vectorstore_path, image_vectorstore_path = multimodal_rag.create_text_and_image_vectorstores()
    
    session['text_vectorstore_path'] = text_vectorstore_path
    session['image_vectorstore_path'] = image_vectorstore_path
    
    VECTORDB_TEXTBOOK = FAISS.load_local(text_vectorstore_path, EMBEDDINGS, allow_dangerous_deserialization=True)
    
    submodules = SUB_MODULE_GENERATOR.generate_submodules_from_textbook(title, VECTORDB_TEXTBOOK)
    values_list = list(submodules.values())
    
    session['title'] = title
    session['user_profile'] = description
    session['submodules'] = submodules
    session['document_directory_path'] = uploads_path 
    session['is_multimodal_rag'] = True
    
    print("\nGenerated Submodules:\n", submodules)
    return jsonify({"message": "Query successful", "submodules": values_list, "response": True}), 200


@users.route('/query2/multimodal-rag-content', methods=['GET'])
async def multimodal_rag_content():
    # user_id = session.get("user_id", None)
    # if user_id is None:
    #     return jsonify({"message": "User not logged in", "response": False}), 401
    
    # user = User.query.get(user_id)
    # if user is None:
    #     return jsonify({"message": "User not found", "response": False}), 404
    
    is_multimodal_rag = session.get("is_multimodal_rag")
    if is_multimodal_rag:
        document_paths = session.get("document_directory_path") 
        title = session.get("title")
        user_profile = session.get("user_profile")
        submodules = session.get("submodules")
        text_vectorstore_path = session.get("text_vectorstore_path")
        image_vectorstore_path = session.get("image_vectorstore_path")
        
        multimodal_rag = MultiModalRAG(
            documents_directory_path=document_paths,
            course_name=title,
            embeddings=EMBEDDINGS,
            clip_model=CLIP_MODEL,
            clip_processor=CLIP_PROCESSOR,
            clip_tokenizer=CLIP_TOKENIZER,
            chunk_size=1000,
            chunk_overlap=200,
            image_similarity_threshold=0.1,
            text_vectorstore_path=text_vectorstore_path,
            image_vectorstore_path=image_vectorstore_path
        )

        content_list, relevant_images_list = await multimodal_rag.execute(CONTENT_GENERATOR, title, submodules=submodules, profile=user_profile, top_k_docs=7)
        final_content = ServerUtils.json_list_to_markdown(content_list)
        return jsonify({"message": "Query successful", "relevant_images": relevant_images_list, "content": final_content, "response": True}), 200
    else:
        submodules = session.get("submodules")
        title = session.get("title")
        keys_list = list(submodules.keys())
        submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
        submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
        submodules_split_three = {key: submodules[key] for key in keys_list[4:]}
        with ThreadPoolExecutor() as executor:
            future_images_list = executor.submit(SerperProvider.module_image_from_web, submodules)
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_one, title,'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_two, title,'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_three, title,'third')
        content_one = future_content_one.result()
        content_two = future_content_two.result()
        content_three = future_content_three.result()
        relevant_images_list = future_images_list.result()
        content_list = content_one + content_two + content_three
        final_content = ServerUtils.json_list_to_markdown(content_list)
        return jsonify({"message": "Query successful", "relevant_images": relevant_images_list, "content": final_content, "response": True}), 200


@users.route('/query2/doc_generate_content',methods=['GET'])
def personalized_module_content():
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response": False}), 404
    source_language ="en"
    characters = string.ascii_letters + string.digits  # Alphanumeric characters
    key = ''.join(secrets.choice(characters) for _ in range(7))
    title=session['title']
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
        future_content_one = executor.submit(CONTENT_GENERATOR.generate_content_from_textbook,title ,submodules_split_one,description,VECTORDB_TEXTBOOK,'first')
        future_content_two = executor.submit(CONTENT_GENERATOR.generate_content_from_textbook,title ,submodules_split_two,description,VECTORDB_TEXTBOOK,'second')
        future_content_three = executor.submit(CONTENT_GENERATOR.generate_content_from_textbook,title ,submodules_split_three,description,VECTORDB_TEXTBOOK,'third')

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
    print(f"Translated submodule content: {trans_submodule_content}")
    
    return jsonify({"message": "Query successful", "images": images_list,"content": trans_submodule_content, "response": True}), 200

# query route --> if websearch is true then fetch from web and feed into model else directly feed into model
# save frequently searched queries in database for faster retrieval
@users.route('/query2/<string:topicname>/<string:level>/<string:websearch>/<string:source_lang>', methods=['GET'])
@cross_origin(supports_credentials=True)
def query_topic(topicname,level,websearch,source_lang):
    # check if user is logged in
    user_id = session.get('user_id')
    print(session.get('user_id'))
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404

    # language detection for input provided
    if source_lang == 'auto':
        source_language = ServerUtils.detect_source_language(topicname)
        print(f"Source Language: {source_language}")
    else:
        source_language=source_lang
        print(f"Source Language: {source_language}")

    trans_topic_name = ""
    # translate other languages input to english
    if source_lang!="english":
        trans_topic_name = GoogleTranslator(source=source_lang, target='en').translate(topicname)
        print(f"Translated topic name: {trans_topic_name}")
    else:
        trans_topic_name = topicname
# check if topic exists in database along with its modulenames and summaries
    topic = Topic.query.filter_by(topic_name=trans_topic_name.lower()).first()
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
        print("web search ture:-")
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
    # translate module summary content to source language
    trans_module_summary_content = ServerUtils.translate_module_summary(module_summary_content, source_language)
    print(f"Translated module summary content: {trans_module_summary_content}")

    return jsonify({"message": "Query successful", "topic_id":topic.topic_id, "topic":trans_topic_name, "source_language":source_language, "module_ids":module_ids, "content": trans_module_summary_content, "response":True}), 200

#course overview route
@users.route('/query2/course-overview/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def course_overview(module_id, source_language, websearch):
    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response": False}), 404
    session["module_id"] = module_id
    
    # check if submodules are saved in the database for the given module_id
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
        print(f"Translated submodule content: {trans_submodule_content}")
        return jsonify({"message": "Query successful","other_modules":modules_dict_list,"module": module_info ,"images": module.image_urls,"videos": module.video_urls, "content": trans_submodule_content, "response": True}), 200
    
    # images = module_image_from_web(module.module_name)
    # if submodules are not generated, generate and save them in the database
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
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content_from_web, submodules_split_one, module.module_name, 'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content_from_web, submodules_split_two, module.module_name, 'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content_from_web, submodules_split_three, module.module_name, 'third')

        else:
            submodules = SUB_MODULE_GENERATOR.generate_submodules(module.module_name)
            print(submodules)
            keys_list = list(submodules.keys())
            future_images_list = executor.submit(SerperProvider.module_image_from_web, submodules)
            future_video_list = executor.submit(SerperProvider.module_videos_from_web, submodules)
            submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
            submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
            submodules_split_three = {key: submodules[key] for key in keys_list[4:]}
            future_content_one = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_one, module.module_name,'first')
            future_content_two = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_two, module.module_name,'second')
            future_content_three = executor.submit(CONTENT_GENERATOR.generate_content, submodules_split_three, module.module_name,'third')

    # Retrieve the results when both functions are done
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

    # add module to ongoing modules for user
    ongoing_module = OngoingModule(user_id=user.user_id, module_id=module_id, level=module.level)
    db.session.add(ongoing_module)
    db.session.commit()

    # translate submodule content to the source language
    trans_submodule_content = ServerUtils.translate_submodule_content(content, source_language)
    print(f"Translated submodule content: {trans_submodule_content}")
    
    return jsonify({"message": "Query successful","other_modules": modules_dict_list,"module": module_info ,"images": module.image_urls,"videos": module.video_urls ,"content": trans_submodule_content,"sub_modules": submodules, "response": True}), 200


# module query --> generate mutlimodal content (with images) for submodules in a module

@users.route('/query2/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def query_module(module_id, source_language, websearch):
    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response": False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response": False}), 404
    session["module_id"] = module_id
    
    # check if submodules are saved in the database for the given module_id
    module = Module.query.get(module_id)
    ongoing_module = OngoingModule.query.filter(OngoingModule.user_id==user.user_id, OngoingModule.module_id==module_id)
    if not ongoing_module:
        ongoing_modules = OngoingModule(user_id=user.user_id, module_id=module_id, level=module.level)
        db.session.add(ongoing_modules)
        db.session.commit()
    if module.submodule_content is not None:
        trans_submodule_content = ServerUtils.translate_submodule_content(module.submodule_content, source_language)
        print(f"Translated submodule content: {trans_submodule_content}")
    return jsonify({"message": "Query successful", "images": module.image_urls,"videos": module.video_urls, "content": trans_submodule_content, "response": True}), 200
    

# download route --> generate pdf for module summary and module content
# currently generate pdf for latin and devanagari scripts 
@users.route('/query2/test', methods=['GET'])
def test():
    ongoing_module = OngoingModule(user_id=2, module_id=78, level='beginner')
    db.session.add(ongoing_module)
    db.session.commit()
    return jsonify({"message": "Query successful"})

@users.route('/query2/<int:module_id>/<string:source_language>/download', methods=['GET'])
def download_pdf(module_id, source_language):
    # get module from database
    module = Module.query.get(module_id)
    modulename = module.module_name
    clean_modulename = modulename.replace(':',"_") 
    module_summary = module.summary
    submodule_content = module.submodule_content

    # translate module summary and submodule content to source language
    trans_modulename = GoogleTranslator(source='en', target=source_language).translate(modulename)
    trans_module_summary = GoogleTranslator(source='en', target=source_language).translate(module_summary)
    trans_submodule_content = ServerUtils.translate_submodule_content(submodule_content, source_language)

    # Create a PDF file
    download_dir = os.path.join(os.getcwd(), "server", "downloads")
    os.makedirs(download_dir, exist_ok=True)
    pdf_file_path = os.path.join(download_dir, f"{clean_modulename}_summary.pdf")

    # Call the generate_pdf function with the custom_styles argument
    PDF_GENERATOR.generate_pdf(pdf_file_path, trans_modulename, trans_module_summary, trans_submodule_content, source_language, module.video_urls)

    # Send the PDF file as an attachment
    return send_file(pdf_file_path, as_attachment=True)

@users.route('/generate-audio', methods=['POST'])
@cross_origin(supports_credentials=True)
def generate_audio():
    data = request.json
    content = data.get('content')
    language = data.get('language') 
    subject_title = data.get('subject_title') 
    subject_content = data.get('subject_content') 

    # check if user is logged in
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    
    full_text = ""
    full_text += f"{subject_title}. {subject_content}. "
    # Combine titles and contents to form full text
    for item in content:
        full_text += f"{item['title']}. {item['content']}. "
    # Create a gTTS object with the combined text
    tts = gTTS(text=full_text, lang=language, slow=False)
    # Create an in-memory file-like object to store the audio data
    audio_file = BytesIO()
    # Save the audio into the in-memory file-like object
    tts.write_to_fp(audio_file)
    audio_file.seek(0)
    # file_path=text_to_speech(trans_output, language=source_lang, directory='audio_files')
    return send_file(audio_file, mimetype='audio/mp3', as_attachment=True, download_name='generated_audio.mp3')



@users.route('/quiz/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def gen_quiz(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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

@users.route('/quiz2/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def gen_quiz2(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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

@users.route('/quiz3/<int:module_id>/<string:source_language>/<string:websearch>', methods=['GET'])
@cross_origin(supports_credentials=True)
def gen_quiz3(module_id, source_language, websearch):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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


@users.route('/add_theory_score/<int:score>')
@cross_origin(supports_credentials=True)
def add_theory_score(score):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    module_id = session.get("module_id", None)
    module = Module.query.get(module_id)
    completed_module = CompletedModule(user_id=user_id, module_id=module_id, level=module.level, theory_quiz_score=score)
    db.session.add(completed_module)
    db.session.commit()
    return jsonify({"message": "Score added successfully", "response": True}), 200

@users.route('/add_application_score/<int:score>')
@cross_origin(supports_credentials=True)
def add_application_score(score):
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"message": "User not found", "response":False}), 404
    module_id = session.get("module_id", None)
    module = Module.query.get(module_id)
    completed_module = CompletedModule.query.filter_by(user_id=user_id, module_id=module_id, level=module.level).first()
    completed_module.application_quiz_score = score
    db.session.commit()
    return jsonify({"message": "Score added successfully", "response": True}), 200

@users.route('/add_assignment_score',methods=['POST'])
@cross_origin(supports_credentials=True)
def add_assignment_score():
    user_id = session.get("user_id", None)
    if user_id is None:
        return jsonify({"message": "User not logged in", "response":False}), 401
    
    # check if user exists
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

@users.route('/chatbot-route', methods=['POST'])
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
        
        # Translate the response back if necessary
        if source_language != 'english':
            trans_output = GoogleTranslator(source='auto', target=source_language).translate(response_text)
        else:
            trans_output = response_text
        
        # Return a JSON response
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
    
@users.route('/query2/voice-save', methods=['POST'])
@cross_origin(supports_credentials=True)
def save_voices():
    try:
        user_id = session.get("user_id", None)
        module_id = session.get("module_id", None)
        if user_id is None:
            return jsonify({"message": "User not logged in", "response": False}), 401

        # check if user exists
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
    
@users.route('/evaluate_quiz/<string:source_language>', methods=['POST'])
@cross_origin(supports_credentials=True)
def evaluate_quiz(source_language):
    try:
        user_id = session.get("user_id", None)
        module_id = session.get("module_id", None)
        if user_id is None:
            return jsonify({"message": "User not logged in", "response": False}), 401
        # check if user exists
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
        # Return the evaluation result
        return jsonify(translate_evaluation_result), 200
    except Exception as e:
        print(f"Error during evaluation: {str(e)}")
        return jsonify({"error": "An error occurred during evaluation"}), 500
    
@users.route('/delete-info', methods=['GET'])
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


@users.route('/api/transaction', methods=['POST'])
@cross_origin(supports_credentials=True)
def store_transaction():
    data = request.json
    new_transaction = Transaction(
        wallet_address=data['address'],
        balance=float(data['balance']),
        transaction_type=data['transaction_type'],
        amount=float(data['amount'])
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify(new_transaction.to_dict()), 201

@users.route('/api/transactions', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_transactions():
    transactions = Transaction.query.order_by(Transaction.timestamp.desc()).all()
    return jsonify([t.to_dict() for t in transactions])