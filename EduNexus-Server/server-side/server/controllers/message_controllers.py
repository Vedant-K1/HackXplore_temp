from bson import ObjectId
from flask import jsonify, request, session
from ..models.chat_models import MessageModel
from datetime import datetime
from server import socketio 

def get_id_type(id_value):
    # MongoDB ObjectID
    if isinstance(id_value, ObjectId):
        return "ObjectId"
    
    if isinstance(id_value, int):
        return "Integer"

    if isinstance(id_value, str):
        if len(id_value) == 24:
            try:
                ObjectId(id_value)
                # MongoDB string id
                return "ObjectId"
            except:
                # Invalid
                pass
        else:
            return 'Integer'
                
        
        # Mail, name, github_id, github_PAT
        # return "String"

    # SQL
    
    
    return f"Other ({type(id_value).__name__})"

def json_serialize_message(obj):
    """
    Recursively convert message object to be fully JSON serializable
    by converting datetime objects and ObjectIds to strings
    """
    if isinstance(obj, dict):
        return {k: json_serialize_message(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [json_serialize_message(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

def get_current_user_id(is_teacher=False):
    """Get the current user's ID based on session"""
    if is_teacher:
        return session.get('teacher_id')
    else:
        return session.get('user_id')

def send_message(request, mongodb, is_teacher=False, get_teacher_func=None, get_student_func=None,current_user_id=None):
    """Send a new message"""
    data = request.json
    chatId = data.get('chatId')
    content = data.get('content')
    
    if not chatId or not content:
        return jsonify({"message": "Invalid data in request body"}), 400
    
    # Get current user ID
    # current_user_id = get_current_user_id(is_teacher)
    if not current_user_id:
        return jsonify({"message": "Not logged in"}), 401
    
    # Identify user type
    current_id_type = get_id_type(current_user_id)
    current_id = ObjectId(current_user_id) if current_id_type == "ObjectId" else int(current_user_id)
    
    # Create message
    message_data = {
        "sender": current_id,
        "content": content,
        "chat": ObjectId(chatId),
    }
    
    messages_collection = mongodb["messages"]
    created_message = MessageModel.create_message(message_data)
    result = messages_collection.insert_one(created_message)
    
    # Get full message with populated data
    message = messages_collection.find_one({"_id": result.inserted_id})
    populated_message = MessageModel.format_message_response(message)
    
    # Populate sender
    sender_id = populated_message['sender']
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
                "pic": student.pic if student.pic else 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                "type": "student"
            }
    
    populated_message['sender'] = sender_data
    
    socket_message = json_serialize_message(populated_message)
    
    # Emit the new message event to the chat room
    chat_room = str(chatId)
    socketio.emit('new message', socket_message, room=chat_room)
    
    # Populate chat
    chat = mongodb["chats"].find_one({"_id": ObjectId(chatId)})
    populated_chat = {
        "_id": str(chat["_id"]),
        "chatName": chat.get("chatName"),
        "isGroupChat": chat.get("isGroupChat"),
        "users": [str(user) if isinstance(user, ObjectId) else int(user) for user in chat.get("users", [])],
    }
    populated_message['chat'] = populated_chat
    
    # Update latest message in chat
    mongodb["chats"].update_one(
        {"_id": ObjectId(chatId)},
        {"$set": {"latestMessage": result.inserted_id, "updatedAt": datetime.now()}}
    )
    
    return jsonify(populated_message), 200

def all_messages(chat_id, mongodb, is_teacher=False, get_teacher_func=None, get_student_func=None,current_user_id=None):
    """Get all messages for a chat"""
    if not chat_id:
        return jsonify({"message": "Chat ID is required"}), 400
    
    # Get current user ID
    # current_user_id = get_current_user_id(is_teacher)
    if not current_user_id:
        return jsonify({"message": "Not logged in"}), 401
    
    # Get messages
    messages_collection = mongodb["messages"]
    messages = list(messages_collection.find({"chat": ObjectId(chat_id)}).sort("createdAt", 1))
    
    # Format and populate messages
    populated_messages = []
    for message in messages:
        populated_message = MessageModel.format_message_response(message)
        
        # Populate sender
        sender_id = populated_message['sender']
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
                    "pic": student.pic if student.pic else 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
                    "type": "student"
                }
        
        populated_message['sender'] = sender_data
        
        # Populate chat
        chat = mongodb["chats"].find_one({"_id": ObjectId(chat_id)})
        populated_chat = {
            "_id": str(chat["_id"]),
            "chatName": chat.get("chatName"),
            "isGroupChat": chat.get("isGroupChat"),
            "users": [str(user) if isinstance(user, ObjectId) else int(user) for user in chat.get("users", [])],
        }
        populated_message['chat'] = populated_chat
        
        populated_messages.append(populated_message)
    
    return jsonify(populated_messages), 200