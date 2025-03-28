import os
from gtts import gTTS
from deep_translator import GoogleTranslator
from flask import session
from models.student_schema import Module
from models.teacher_schema import Course as TeacherCourse
from lingua import LanguageDetectorBuilder
import random
import string


LANG_DETECTOR = LanguageDetectorBuilder.from_all_languages().with_preloaded_language_models().build()

class ServerUtils:
    @staticmethod
    def translate_module_summary(content, target_language):
        if target_language=='en':
            return content
        
        trans_content = {}
        for key, value in content.items():
            trans_key = GoogleTranslator(source='en', target=target_language).translate(str(key))
            trans_content[trans_key] = GoogleTranslator(source='en', target=target_language).translate(str(value))
        return trans_content
    
    @staticmethod
    def translate_submodule_content(content, target_language):
        if target_language=='en':
            return content
        
        trans_content = []
        for entry in content:
            temp = {}
            for key, value in entry.items():
                if key == 'urls':
                    temp[key] = value
                    continue
                if key == 'subsections':
                    temp[key] = []
                    for subsection in value:
                        temp_subsections = {}
                        for sub_key, sub_value in subsection.items():
                            temp_subsections[sub_key] = GoogleTranslator(source='auto', target=target_language).translate(str(sub_value))
                        temp[key].append(temp_subsections)
                else:
                    temp[key] = GoogleTranslator(source='auto', target=target_language).translate(str(value))
            trans_content.append(temp)
        return trans_content
    
    @staticmethod
    def translate_quiz(quiz_data, target_language):
        if target_language=='en':
            return quiz_data
        
        trans_quiz=[]
        for entry in quiz_data:
            temp = {}
            for key, val in entry.items():
                if key != 'options':
                    temp[key] = GoogleTranslator(source='auto', target=target_language).translate(str(val))
                else:
                    temp[key] = []
                    for option in val:
                        temp[key].append(GoogleTranslator(source='auto', target=target_language).translate(str(option)))

            trans_quiz.append(temp)
        
        return trans_quiz
    
    @staticmethod
    def translate_assignment(questions, target_language):
        if target_language=='en':
            return questions
        
        trans_questions=[]
        for entry in questions:
            trans_questions.append(GoogleTranslator(source='auto', target=target_language).translate(str(entry)))

        return trans_questions
    
    @staticmethod
    def translate_responses(responses, target_language):
        if target_language=='en':
            return responses
        
        trans_response = []
        for entry in responses:
            temp = {}
            for key, val in entry.items():
                temp[key] = GoogleTranslator(source='auto', target=target_language).translate(str(val))
            trans_response.append(temp)
        
        return trans_response

    @staticmethod
    def translate_evaluations(evaluations, target_language):
        if target_language=='en':
            return evaluations
        
        trans_eval = {}
        for key, val in evaluations.items():
            trans_eval[key] = GoogleTranslator(source='auto', target=target_language).translate(str(val))

        return trans_eval
    
    @staticmethod
    def text_to_speech(text, language='en', directory='audio_files'):
        if not os.path.exists(directory):
            os.makedirs(directory)
        # Create a gTTS object
        speech = gTTS(text=text, lang=language, slow=False)
        # Specify the file path including the directory to save the MP3 file
        file_path = os.path.join(directory, 'text.mp3')
        # Save the speech to the specified file path
        speech.save(file_path)
        return file_path
    
    @staticmethod
    def detect_source_language(text):
        return str(LANG_DETECTOR.detect_language_of(text)).split('.')[1].lower()
    
    @staticmethod
    def json_list_to_markdown(content_list : list[dict]):
        final_content = []
        for content in content_list:
            markdown = ""
            for key, value in content.items():
                if key == "title_for_the_content":
                    markdown += f"# {value}\n"
                elif key == "content":
                    markdown += f"{value}\n\n"
                elif key == "subsections":
                    for i in content["subsections"]:
                        for key, value in i.items():
                            if key == "title":
                                markdown += f"## {value}\n"
                            elif key == "content":
                                markdown += f"{value}\n\n"
            final_content.append({content["subject_name"]: markdown})
        return final_content
    
    @staticmethod
    def generate_course_code(course_collection, length=6):
        while True:
            course_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
            if course_collection.find_one({"course_code": course_code}) is None:
                return course_code

class AssistantUtils:
    @staticmethod
    def get_page_context(index: int = 1):
        '''Get information about the current page that the user is exploring. Used to answer user queries related to the current page they're exploring.
        Args:
            index (int): Index of the submodule.
        '''
        module_id = session.get("module_id", None)
        module = Module.query.get(module_id)
        data = module.submodule_content[index]
        all_text = (
        f"{data['subject_name']}\n"
        f"{data['title_for_the_content']}\n"
        f"{data['content']}\n"
        )

        for subsection in data['subsections']:
            all_text += f"{subsection['title']}\n{subsection['content']}\n"
        print("submodule_content------------------------",all_text)
        return all_text
