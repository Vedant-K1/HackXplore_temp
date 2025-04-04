from bson import ObjectId
import json
import bcrypt
from datetime import datetime

class ChatModel:
    @staticmethod
    def create_chat(chat_data):
        """Create a new chat document"""
        chat_data["createdAt"] = datetime.now()
        chat_data["updatedAt"] = datetime.now()
        return chat_data
    
    @staticmethod
    def format_chat_response(chat, populate_users=False, populate_admin=False, populate_latest=False):
        """Format chat object for response"""
        if chat:
            chat['_id'] = str(chat['_id'])
            if 'users' in chat:
                chat['users'] = [str(user) if isinstance(user, ObjectId) else user for user in chat['users']]
            if 'groupAdmin' in chat and chat['groupAdmin']:
                chat['groupAdmin'] = str(chat['groupAdmin']) if isinstance(chat['groupAdmin'], ObjectId) else chat['groupAdmin']
            if 'latestMessage' in chat and chat['latestMessage']:
                chat['latestMessage'] = str(chat['latestMessage']) if isinstance(chat['latestMessage'], ObjectId) else chat['latestMessage']
        return chat

class MessageModel:
    @staticmethod
    def create_message(message_data):
        """Create a new message document"""
        message_data["createdAt"] = datetime.now()
        message_data["updatedAt"] = datetime.now()
        return message_data
    
    @staticmethod
    def format_message_response(message):
        """Format message object for response"""
        if message:
            message['_id'] = str(message['_id'])
            if 'sender' in message:
                message['sender'] = str(message['sender']) if isinstance(message['sender'], ObjectId) else message['sender']
            if 'chat' in message:
                message['chat'] = str(message['chat']) if isinstance(message['chat'], ObjectId) else message['chat']
        return message