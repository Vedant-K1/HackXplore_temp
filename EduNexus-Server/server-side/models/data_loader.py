import faiss
from langchain_community.document_loaders import PyPDFDirectoryLoader,WebBaseLoader
from langchain_community.document_loaders.merge import MergedDataLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from models.data_utils import DocumentUtils, WebUtils
from server.utils import ServerUtils
from deep_translator import GoogleTranslator
import asyncio
import numpy as np
import os

SCRAPFLY_API_KEY = os.getenv("SCRAPFLY_API_KEY")
class DocumentLoader:
    @staticmethod
    async def create_faiss_vectorstore_for_text(documents_directory, embeddings, chunk_size, chunk_overlap, input_type, links):
        print("\nCreating FAISS Vector database for text...\n")
        if input_type=="pdf":
            loader = PyPDFDirectoryLoader(documents_directory)
        elif input_type=="link":
            loader = WebBaseLoader(
                links,
                continue_on_failure=True,
            )
        elif input_type=="pdf_and_link":
            web_loader = loader = WebBaseLoader(
                links,
                continue_on_failure=True,
            )
            pdf_loader = PyPDFDirectoryLoader(documents_directory)
            loader = MergedDataLoader(loaders=[web_loader, pdf_loader])
        elif input_type=="pdf_and_web":
            loader = PyPDFDirectoryLoader(documents_directory)
        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap, length_function=len
        )
        docs = text_splitter.split_documents(documents)
        texts = [doc.page_content.replace('\n', '') for doc in docs]
        source_language = ServerUtils.detect_source_language(texts[0])
        source_language = "english"
        if source_language != 'english':
            print(f"\nDocument is {source_language}. Translating to English\n")
            trans_texts = GoogleTranslator(source=source_language, target='en').translate_batch(texts)
        else:
            print("Document language is English. No translation required.")
            trans_texts = texts
        vectorstore = FAISS.from_texts(trans_texts, embeddings)
        print("\nFAISS Vector database for text created.\n")
        return vectorstore
    
    @staticmethod
    async def create_faiss_vectorstore_for_image(documents_directory, image_directory_path, clip_model, clip_processor, input_type, links):
        print("\nCreating FAISS Vector database for images...\n")
        if input_type=="pdf":
            await DocumentUtils.extract_images_from_directory(documents_directory=documents_directory, output_directory_path=image_directory_path)
        elif input_type == "link":
            await WebUtils.extract_images_from_webpages(urls=links, output_directory_path=image_directory_path)
        elif input_type =="pdf_and_link":
            await asyncio.gather(
                DocumentUtils.extract_images_from_directory(documents_directory,image_directory_path),
                WebUtils.extract_images_from_webpages(links,image_directory_path)
            )
        images_in_directory = []
        for root, dirs, files in os.walk(image_directory_path):
            for file in files:
                if file.endswith(('png', 'jpg', 'jpeg')):
                    images_in_directory.append(os.path.join(root, file))
        
        image_embeddings = np.vstack([DocumentUtils.embed_image_with_clip(image, clip_model=clip_model, clip_processor=clip_processor) for image in images_in_directory])
        print("\nImages converted to embeddings\n")
        vectorstore = faiss.IndexFlatIP(512)
        vectorstore.add(image_embeddings)
        print("\nFAISS Vector database for images created.\n")
        return vectorstore
