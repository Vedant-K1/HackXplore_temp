from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
from datetime import datetime
from bson import ObjectId
from server import socketio

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

@socketio.on('connect')
def handle_connect():
    print("Client connected to socket.io")

@socketio.on('setup')
def handle_setup(userData):
    room = userData.get('_id')
    join_room(room)
    print(f"User {room} joined their room")
    emit('connected')

@socketio.on('join chat')
def handle_join_chat(room):
    join_room(room)
    print(f"User joined room: {room}")

# @socketio.on('typing')
# def handle_typing(room):
#     emit('typing', room=room)

# @socketio.on('stop typing')
# def handle_stop_typing(room):
#     emit('stop typing', room=room)
@socketio.on('typing')
def handle_typing(data):
    room = data.get('room')
    user_id = data.get('userId')
    # Pass along who is typing to all clients in the room
    emit('typing', user_id, room=room)

@socketio.on('stop typing')
def handle_stop_typing(data):
    room = data.get('room')
    user_id = data.get('userId')
    emit('stop typing', user_id, room=room)
    
@socketio.on('new message')
def handle_new_message(new_message_received):
    # Serialize incoming message before processing
    new_message_received = json_serialize_message(new_message_received)
    
    chat = new_message_received.get('chat', {})
    
    if not chat:
        return
        
    chat_id = chat.get('_id')
    
    if not chat_id:
        return
    
    # First, send to the entire chat room
    emit('message received', new_message_received, room=chat_id)
    
    # Then send to each user's individual room
    users = chat.get('users', [])
    sender_id = new_message_received.get('sender', {}).get('_id')
    
    for user_id in users:
        if isinstance(user_id, dict) and '_id' in user_id:
            user_id = user_id['_id']
            
        # Don't send to the sender
        if user_id != sender_id:
            emit('message received', new_message_received, room=user_id)

# @socketio.on('new message')
# def handle_new_message(new_message_received):
#     chat = new_message_received.get('chat', {})
    
#     if not chat:
#         return
        
#     chat_id = chat.get('_id')
    
#     if not chat_id:
#         return
    
#     # First, send to the entire chat room
#     emit('message received', new_message_received, room=chat_id)
    
#     # Then send to each user's individual room
#     users = chat.get('users', [])
#     sender_id = new_message_received.get('sender', {}).get('_id')
    
#     for user_id in users:
#         # If user_id is an object with _id property, use that
#         if isinstance(user_id, dict) and '_id' in user_id:
#             user_id = user_id['_id']
            
#         # Don't send to the sender
#         if user_id != sender_id:
#             emit('message received', new_message_received, room=user_id)