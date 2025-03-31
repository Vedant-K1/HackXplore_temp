from bson import ObjectId
from flask import jsonify, request, session
from ..models.chat_models import ChatModel, MessageModel
import json
import datetime

def get_id_type(id_value):
    # MongoDB ObjectID
    if isinstance(id_value, ObjectId):
        return "ObjectId"

    if isinstance(id_value, str):
        if len(id_value) == 24:
            try:
                ObjectId(id_value)
                # MongoDB string id
                return "ObjectId"
            except:
                # Invalid
                pass 
        
        # Mail, name, github_id, github_PAT
        return "String"

    # SQL
    if isinstance(id_value, int):
        return "Integer"
    
    return f"Other ({type(id_value).__name__})"

def get_current_user_id(is_teacher=False):
    """Get the current user's ID based on session"""
    if is_teacher:
        return session.get('teacher_id')
    else:
        return session.get('user_id')

def access_chat(request, mongodb, is_teacher=False, get_teacher_func=None, get_student_func=None):
    """Create or access a one-on-one chat"""
    data = request.json
    userId = data.get('userId')
    
    if not userId:
        return jsonify({"message": "userId param not sent with request"}), 400
    
    # Get current user ID
    current_user_id = get_current_user_id(is_teacher)
    print("IIIIIiiiiiiiiiii",current_user_id)
    if not current_user_id:
        return jsonify({"message": "Not logged in"}), 401
    
    # Identify user types
    current_id_type = get_id_type(current_user_id)
    target_id_type = get_id_type(userId)
    
    # Find existing chat
    chats_collection = mongodb["chats"]
    
    # Convert IDs to proper format
    current_id = ObjectId(current_user_id) if current_id_type == "ObjectId" else current_user_id
    target_id = ObjectId(userId) if target_id_type == "ObjectId" else userId
    
    # Find existing chat
    chat = chats_collection.find_one({
        "isGroupChat": False,
        "users": {"$all": [current_id, target_id]}
    })
    
    if chat:
        # Populate users
        populated_chat = ChatModel.format_chat_response(chat)
        
        # Populate user details
        populated_users = []
        for user_id in populated_chat['users']:
            user_id_type = get_id_type(user_id)
            if user_id_type == "ObjectId" or len(user_id) == 24:
                # Try to find in teachers collection
                teacher = get_teacher_func(user_id)
                if teacher:
                    teacher_data = {
                        "_id": user_id,
                        "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                        "email": teacher.get('email', ''),
                        "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                        "type": "teacher"
                    }
                    populated_users.append(teacher_data)
                    continue
            
            # Try to find in students SQL
            student = get_student_func(user_id)
            if student:
                student_data = {
                    "_id": user_id,
                    "name": f"{student.fname} {student.lname}",
                    "email": student.email,
                    "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                    "type": "student"
                }
                populated_users.append(student_data)
        
        populated_chat['users'] = populated_users
        
        # Populate latest message
        if 'latestMessage' in populated_chat and populated_chat['latestMessage']:
            message = mongodb["messages"].find_one({"_id": ObjectId(populated_chat['latestMessage'])})
            if message:
                sender_id = message.get('sender')
                sender_id_type = get_id_type(sender_id)
                
                sender = None
                if sender_id_type == "ObjectId" or (isinstance(sender_id, str) and len(sender_id) == 24):
                    sender = get_teacher_func(sender_id)
                    if sender:
                        sender_data = {
                            "_id": str(sender_id),
                            "name": f"{sender.get('first_name', '')} {sender.get('last_name', '')}",
                            "email": sender.get('email', ''),
                            "pic": sender.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                            "type": "teacher"
                        }
                
                if not sender:
                    sender = get_student_func(sender_id)
                    if sender:
                        sender_data = {
                            "_id": str(sender_id),
                            "name": f"{sender.fname} {sender.lname}",
                            "email": sender.email,
                            "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                            "type": "student"
                        }
                
                message = MessageModel.format_message_response(message)
                message['sender'] = sender_data
                populated_chat['latestMessage'] = message
        
        return jsonify(populated_chat), 200
    else:
        # Create new chat
        chat_data = {
            "chatName": "sender",
            "isGroupChat": False,
            "users": [current_id, target_id],
        }
        
        created_chat = ChatModel.create_chat(chat_data)
        result = chats_collection.insert_one(created_chat)
        
        # Get the full chat with populated users
        full_chat = chats_collection.find_one({"_id": result.inserted_id})
        populated_chat = ChatModel.format_chat_response(full_chat)
        
        # Populate user details
        populated_users = []
        for user_id in populated_chat['users']:
            user_id_type = get_id_type(user_id)
            if user_id_type == "ObjectId" or (isinstance(user_id, str) and len(user_id) == 24):
                # Try to find in teachers collection
                teacher = get_teacher_func(user_id)
                if teacher:
                    teacher_data = {
                        "_id": str(user_id),
                        "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                        "email": teacher.get('email', ''),
                        "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                        "type": "teacher"
                    }
                    populated_users.append(teacher_data)
                    continue
            
            # Try to find in students SQL
            student = get_student_func(user_id)
            if student:
                student_data = {
                    "_id": str(user_id),
                    "name": f"{student.fname} {student.lname}",
                    "email": student.email,
                    "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                    "type": "student"
                }
                populated_users.append(student_data)
        
        populated_chat['users'] = populated_users
        return jsonify(populated_chat), 200

def fetch_chats(mongodb, is_teacher=False, get_teacher_func=None, get_student_func=None,current_user_id=None):
    """Fetch all chats for the current user"""
    # current_user_id = get_current_user_id(is_teacher)
    print("IIIIIiiiiiiiiiii",current_user_id)
    if not current_user_id:
        return jsonify({"message": "Not logged in"}), 401
     
    # Identify user type
    current_id_type = get_id_type(current_user_id)
    current_id = ObjectId(current_user_id) if current_id_type == "ObjectId" else current_user_id
    
    # Find chats
    chats_collection = mongodb["chats"]
    chats = list(chats_collection.find({"users": current_id}).sort("updatedAt", -1))
    
    # Format and populate chats
    populated_chats = []
    for chat in chats:
        populated_chat = ChatModel.format_chat_response(chat)
        
        # Populate users
        populated_users = []
        for user_id in populated_chat['users']:
            user_id_type = get_id_type(user_id)
            if user_id_type == "ObjectId" or (isinstance(user_id, str) and len(user_id) == 24):
                # Try to find in teachers collection
                teacher = get_teacher_func(user_id)
                if teacher:
                    teacher_data = {
                        "_id": str(user_id),
                        "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                        "email": teacher.get('email', ''),
                        "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                        "type": "teacher"
                    }
                    populated_users.append(teacher_data)
                    continue
            
            # Try to find in students SQL
            student = get_student_func(user_id)
            if student:
                student_data = {
                    "_id": str(user_id),
                    "name": f"{student.fname} {student.lname}",
                    "email": student.email,
                    "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                    "type": "student"
                }
                populated_users.append(student_data)
        
        populated_chat['users'] = populated_users
        
        # Populate group admin if exists
        if 'groupAdmin' in populated_chat and populated_chat['groupAdmin']:
            admin_id = populated_chat['groupAdmin']
            admin_id_type = get_id_type(admin_id)
            
            if admin_id_type == "ObjectId" or (isinstance(admin_id, str) and len(admin_id) == 24):
                teacher = get_teacher_func(admin_id)
                if teacher:
                    admin_data = {
                        "_id": str(admin_id),
                        "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                        "email": teacher.get('email', ''),
                        "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                        "type": "teacher"
                    }
                    populated_chat['groupAdmin'] = admin_data
            
            if 'groupAdmin' in populated_chat and isinstance(populated_chat['groupAdmin'], str):
                student = get_student_func(admin_id)
                if student:
                    admin_data = {
                        "_id": str(admin_id),
                        "name": f"{student.fname} {student.lname}",
                        "email": student.email,
                        "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                        "type": "student"
                    }
                    populated_chat['groupAdmin'] = admin_data
        
        # Populate latest message
        if 'latestMessage' in populated_chat and populated_chat['latestMessage']:
            message = mongodb["messages"].find_one({"_id": ObjectId(populated_chat['latestMessage'])})
            if message:
                sender_id = message.get('sender')
                sender_id_type = get_id_type(sender_id)
                
                sender_data = None
                if sender_id_type == "ObjectId" or (isinstance(sender_id, str) and len(sender_id) == 24):
                    teacher = get_teacher_func(sender_id)
                    if teacher:
                        sender_data = {
                            "_id": str(sender_id),
                            "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                            "email": teacher.get('email', ''),
                            "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                            "type": "teacher"
                        }
                
                if not sender_data:
                    student = get_student_func(sender_id)
                    if student:
                        sender_data = {
                            "_id": str(sender_id),
                            "name": f"{student.fname} {student.lname}",
                            "email": student.email,
                            "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                            "type": "student"
                        }
                
                message = MessageModel.format_message_response(message)
                message['sender'] = sender_data
                populated_chat['latestMessage'] = message
        
        populated_chats.append(populated_chat)
    
    return jsonify(populated_chats), 200

def create_group_chat(request, mongodb, is_teacher=False, get_teacher_func=None, get_student_func=None):
    """Create a group chat"""
    data = request.json
    name = data.get('name')
    users = data.get('users')
    
    if not name or not users:
        return jsonify({"message": "Please fill all the fields"}), 400
    
    if len(users) < 2:
        return jsonify({"message": "More than 2 users are required to form a group chat"}), 400
    
    # Get current user ID
    current_user_id = get_current_user_id(is_teacher)
    if not current_user_id:
        return jsonify({"message": "Not logged in"}), 401
    
    # Identify user type and convert ID
    current_id_type = get_id_type(current_user_id)
    current_id = ObjectId(current_user_id) if current_id_type == "ObjectId" else current_user_id
    
    # Add current user to the group
    users.append(str(current_id))
    
    # Convert user IDs to appropriate format
    formatted_users = []
    for user_id in users:
        user_id_type = get_id_type(user_id)
        if user_id_type == "ObjectId" or (isinstance(user_id, str) and len(user_id) == 24):
            try:
                formatted_users.append(ObjectId(user_id))
            except:
                formatted_users.append(user_id)
        else:
            formatted_users.append(user_id)
    
    # Create group chat
    chat_data = {
        "chatName": name,
        "isGroupChat": True,
        "users": formatted_users,
        "groupAdmin": current_id,
    }
    
    chats_collection = mongodb["chats"]
    created_chat = ChatModel.create_chat(chat_data)
    result = chats_collection.insert_one(created_chat)
    
    # Get full group chat with populated data
    full_chat = chats_collection.find_one({"_id": result.inserted_id})
    populated_chat = ChatModel.format_chat_response(full_chat)
    
    # Populate users
    populated_users = []
    for user_id in populated_chat['users']:
        user_id_type = get_id_type(user_id)
        if user_id_type == "ObjectId" or (isinstance(user_id, str) and len(user_id) == 24):
            # Try to find in teachers collection
            teacher = get_teacher_func(user_id)
            if teacher:
                teacher_data = {
                    "_id": str(user_id),
                    "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                    "email": teacher.get('email', ''),
                    "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                    "type": "teacher"
                }
                populated_users.append(teacher_data)
                continue
        
        # Try to find in students SQL
        student = get_student_func(user_id)
        if student:
            student_data = {
                "_id": str(user_id),
                "name": f"{student.fname} {student.lname}",
                "email": student.email,
                "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                "type": "student"
            }
            populated_users.append(student_data)
    
    populated_chat['users'] = populated_users
    
    # Populate group admin
    admin_id = populated_chat['groupAdmin']
    admin_id_type = get_id_type(admin_id)
    
    if admin_id_type == "ObjectId" or (isinstance(admin_id, str) and len(admin_id) == 24):
        teacher = get_teacher_func(admin_id)
        if teacher:
            admin_data = {
                "_id": str(admin_id),
                "name": f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}",
                "email": teacher.get('email', ''),
                "pic": teacher.get('pic', 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'),
                "type": "teacher"
            }
            populated_chat['groupAdmin'] = admin_data
    
    if isinstance(populated_chat['groupAdmin'], str) or populated_chat['groupAdmin'] == admin_id:
        student = get_student_func(admin_id)
        if student:
            admin_data = {
                "_id": str(admin_id),
                "name": f"{student.fname} {student.lname}",
                "email": student.email,
                "pic": 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                "type": "student"
            }
            populated_chat['groupAdmin'] = admin_data
    
    return jsonify(populated_chat), 200

def rename_group(request, mongodb, is_teacher=False):
    """Rename a group chat"""
    data = request.json
    chatId = data.get('chatId')
    chatName = data.get('chatName')
    
    if not chatId or not chatName:
        return jsonify({"message": "Please provide chat ID and name"}), 400
    
    # Update chat name
    chats_collection = mongodb["chats"]
    updated_chat = chats_collection.find_one_and_update(
        {"_id": ObjectId(chatId)},
        {"$set": {"chatName": chatName, "updatedAt": datetime.now()}},
        return_document=True
    )
    
    if not updated_chat:
        return jsonify({"message": "Chat not found"}), 404
    
    return jsonify(ChatModel.format_chat_response(updated_chat)), 200

def add_to_group(request, mongodb, is_teacher=False):
    """Add a user to a group chat"""
    data = request.json
    chatId = data.get('chatId')
    userId = data.get('userId')
    
    if not chatId or not userId:
        return jsonify({"message": "Please provide chat ID and user ID"}), 400
    
    # Identify user type
    user_id_type = get_id_type(userId)
    user_id = ObjectId(userId) if user_id_type == "ObjectId" else userId
    
    # Update chat
    chats_collection = mongodb["chats"]
    updated_chat = chats_collection.find_one_and_update(
        {"_id": ObjectId(chatId)},
        {"$push": {"users": user_id}, "$set": {"updatedAt": datetime.now()}},
        return_document=True
    )
    
    if not updated_chat:
        return jsonify({"message": "Chat not found"}), 404
    
    return jsonify(ChatModel.format_chat_response(updated_chat)), 200

def remove_from_group(request, mongodb, is_teacher=False):
    """Remove a user from a group chat"""
    data = request.json
    chatId = data.get('chatId')
    userId = data.get('userId')
    
    if not chatId or not userId:
        return jsonify({"message": "Please provide chat ID and user ID"}), 400
    
    # Identify user type
    user_id_type = get_id_type(userId)
    user_id = ObjectId(userId) if user_id_type == "ObjectId" else userId
    
    # Update chat
    chats_collection = mongodb["chats"]
    updated_chat = chats_collection.find_one_and_update(
        {"_id": ObjectId(chatId)},
        {"$pull": {"users": user_id}, "$set": {"updatedAt": datetime.now()}},
        return_document=True
    )
    
    if not updated_chat:
        return jsonify({"message": "Chat not found"}), 404
    
    return jsonify(ChatModel.format_chat_response(updated_chat)), 200