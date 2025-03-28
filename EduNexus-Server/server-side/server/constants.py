from langchain_google_genai import GoogleGenerativeAIEmbeddings
import torch
from transformers import AutoImageProcessor, AutoModel, AutoTokenizer
from api.gemini_client import GeminiProvider
from api.serper_client import SerperProvider
from api.tavily_client import TavilyProvider
from core.submodule_generator import SubModuleGenerator
from core.content_generator import ContentGenerator
from core.module_generator import ModuleGenerator
from core.quiz_generator import QuizGenerator
from core.pdf_generator import PdfGenerator
from core.ppt_generator import PptGenerator
from core.lab_manual_generator import LabManualGenerator
from core.evaluator import Evaluator
from core.recommendation_generator import RecommendationGenerator
from core.lesson_planner import LessonPlanner
from core.skills_analyzer import SkillsAnalyzer
from core.teacher_pdf_generator import MarkdownPdfGenerator
from server.utils import AssistantUtils
import os

DEVICE_TYPE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMAGE_EMBEDDING_MODEL_NAME = "openai/clip-vit-base-patch16"
CLIP_MODEL = AutoModel.from_pretrained(IMAGE_EMBEDDING_MODEL_NAME).to(DEVICE_TYPE)
CLIP_PROCESSOR = AutoImageProcessor.from_pretrained(IMAGE_EMBEDDING_MODEL_NAME)
CLIP_TOKENIZER = AutoTokenizer.from_pretrained(IMAGE_EMBEDDING_MODEL_NAME, clean_up_tokenization_spaces=True)
EMBEDDINGS = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
GEMINI_CLIENT = GeminiProvider()
TAVILY_CLIENT = TavilyProvider()
SERPER_CLIENT = SerperProvider()
TOOLS = [AssistantUtils.get_page_context]
MODULE_GENERATOR = ModuleGenerator()
SUB_MODULE_GENERATOR = SubModuleGenerator()
CONTENT_GENERATOR = ContentGenerator()
PDF_GENERATOR = PdfGenerator()
TEACHER_PDF_GENERATOR = MarkdownPdfGenerator()
LAB_MANUAL_GENERATOR = LabManualGenerator()
PPT_GENERATOR = PptGenerator()
QUIZ_GENERATOR = QuizGenerator()
LESSON_PLANNER = LessonPlanner()
SKILLS_ANALYZER = SkillsAnalyzer()
RECOMMENDATION_GENERATOR = RecommendationGenerator()
EVALUATOR = Evaluator()
USER_DOCS_PATH = os.path.join('server', 'user_docs')
AVAILABLE_TOOLS = {
    'get_context_from_page': AssistantUtils.get_page_context
}