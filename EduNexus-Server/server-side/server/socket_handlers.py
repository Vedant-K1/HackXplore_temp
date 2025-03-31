from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request

from server import socketio

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

@socketio.on('typing')
def handle_typing(room):
    emit('typing', room=room)

@socketio.on('stop typing')
def handle_stop_typing(room):
    emit('stop typing', room=room)

@socketio.on('new message')
def handle_new_message(new_message_received):
    chat = new_message_received.get('chat', {})
    users = chat.get('users', [])
    
    if not users:
        return
    
    for user in users:
        if user.get('_id') != new_message_received.get('sender', {}).get('_id'):
            emit('message received', new_message_received, room=user.get('_id'))