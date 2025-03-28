from models.data_loader import DocumentLoader
from models.data_utils import DocumentUtils
from api.serper_client import SerperProvider
from api.tavily_client import TavilyProvider
from core.content_generator import ContentGenerator
from langchain_community.vectorstores.faiss import FAISS
import faiss
import os
import asyncio
from pykka import ThreadingActor
from concurrent.futures import ThreadPoolExecutor
from pykka import ThreadingActor

class ResultHandler(ThreadingActor):
    async def receive(self, message):
        if isinstance(message, str):
            print("Received result:", message)
        else:
            print(f"Warning: Unexpected message type received: {type(message)}")

class SimpleRAG:
    def __init__(
            self,
            course_name=None,
            syllabus_directory_path=None,
            embeddings=None,
            chunk_size=1000,
            chunk_overlap=200,
            text_vectorstore_path=None,
    ):
        if syllabus_directory_path is None:
            raise Exception("Syllabus pdf path must be provided")
        self.syllabus_directory_path = syllabus_directory_path
        self.embeddings = embeddings
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.current_dir = os.path.dirname(__file__)
        self.faiss_vectorstore_directory = os.path.join(self.current_dir, 'syllabus-vectorstore')
        os.makedirs(self.faiss_vectorstore_directory, exist_ok=True)
        self.text_vectorstore_path = os.path.join(self.faiss_vectorstore_directory, course_name)
        if text_vectorstore_path is not None:
            self.text_vectorstore = FAISS.load_local(text_vectorstore_path, embeddings=embeddings, allow_dangerous_deserialization=True)
        else:
            self.text_vectorstore = None
        
    async def create_text_vectorstore(self):
        self.text_vectorstore = await DocumentLoader.create_faiss_vectorstore_for_text(documents_directory=self.syllabus_directory_path, embeddings=self.embeddings, chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap, input_type='pdf', links=[])
        self.text_vectorstore.save_local(self.text_vectorstore_path)
        return self.text_vectorstore_path
    
    async def search_similar_text(self, query, k=5):
        relevant_docs = self.text_vectorstore.similarity_search(query, k=k)
        rel_docs = [doc.page_content for doc in relevant_docs]
        context = '\n'.join(rel_docs)
        return context

class MultiModalRAG:
    def __init__(
            self, 
            course_name=None,
            lesson_name=None,
            lesson_type=None,
            documents_directory_path=None, 
            embeddings=None, 
            clip_model=None, 
            clip_processor=None,
            clip_tokenizer=None,
            chunk_size=1000,
            chunk_overlap=200,
            image_similarity_threshold=0.22,
            text_vectorstore_path=None,
            image_vectorstore_path=None,
            input_type=None,
            links=None,
            include_images=None,
    ):
        self.course_name = course_name
        self.lesson_name = lesson_name
        self.lesson_type = lesson_type
        if documents_directory_path is None:
            raise Exception("Document Directory Path path must be provided")
        self.documents_directory_path = documents_directory_path
        self.embeddings = embeddings
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.clip_model = clip_model
        self.clip_processor = clip_processor
        self.clip_tokenizer = clip_tokenizer
        self.image_similarity_threshold = image_similarity_threshold
        if input_type not in ["pdf", "link", "pdf_and_link", "pdf_and_web"]:
            raise Exception("input_type should be pdf, link, pdf_and_link or pdf_and_web")
        self.input_type = input_type
        self.links = links

        self.current_dir = os.path.dirname(__file__)
        self.faiss_vectorstore_directory = os.path.join(self.current_dir, 'faiss-vectorstore')
        os.makedirs(self.faiss_vectorstore_directory, exist_ok=True)
        self.image_directory_path = os.path.join(self.current_dir, 'extracted-images', lesson_name)
        self.text_vectorstore_path = os.path.join(self.faiss_vectorstore_directory, 'text-faiss-index')
        self.image_vectorstore_path = os.path.join(self.faiss_vectorstore_directory, 'image-faiss-index')
        if text_vectorstore_path is not None:
            self.text_vectorstore = FAISS.load_local(text_vectorstore_path, embeddings=embeddings, allow_dangerous_deserialization=True)
        else:
            self.text_vectorstore = None
        
        if image_vectorstore_path is not None:
            self.image_vectorstore = faiss.read_index(image_vectorstore_path)
        else:
            self.image_vectorstore = None
        
        self.include_images = include_images

    async def create_text_and_image_vectorstores(self):
        result_handler = ResultHandler.start()
        try:
            if self.include_images:
                with ThreadPoolExecutor() as executor:
                    tasks = [
                        executor.submit(asyncio.run, DocumentLoader.create_faiss_vectorstore_for_text(self.documents_directory_path, self.embeddings, self.chunk_size, self.chunk_overlap, self.input_type, self.links)),
                        executor.submit(asyncio.run, DocumentLoader.create_faiss_vectorstore_for_image(self.documents_directory_path, self.image_directory_path, self.clip_model, self.clip_processor, self.input_type, self.links)),
                    ]
                self.text_vectorstore = tasks[0].result()
                self.image_vectorstore = tasks[1].result()
                result_handler.tell((self.text_vectorstore, self.image_vectorstore))
                faiss.write_index(self.image_vectorstore, self.image_vectorstore_path)
            else:
                self.text_vectorstore = await DocumentLoader.create_faiss_vectorstore_for_text(self.documents_directory_path, self.embeddings, self.chunk_size, self.chunk_overlap, self.input_type, self.links)
                result_handler.tell("Text Vector store created")
        finally:
            result_handler.stop()
            
        self.text_vectorstore.save_local(self.text_vectorstore_path)
        return self.text_vectorstore_path, self.image_vectorstore_path

    def search_image(self, query_text, image_paths):
        query_image_embeddings = DocumentUtils.embed_text_with_clip(text=query_text, clip_model=self.clip_model, clip_tokenizer=self.clip_tokenizer)
        dist, indx = self.image_vectorstore.search(query_image_embeddings, k=len(image_paths))
        distances = dist[0]
        indexes = indx[0]
        sorted_images = [image_paths[idx] for idx in indexes]
        top_k_images = [sorted_images[i] for i in range(len(indexes)) if distances[i]>= self.image_similarity_threshold]
        return top_k_images

    def search_text(self, query_text, k):
        top_k_docs = self.text_vectorstore.similarity_search(query_text, k=k)
        return top_k_docs
    
    async def asearch_text(self, query_text, k):
        top_k_docs = self.text_vectorstore.asimilarity_search(query_text, k=k)
        return top_k_docs
    
    async def run(self, content_generator : ContentGenerator, module_name : str, submodule_split : dict, profile : str, top_k_docs : int):
        images_in_directory = []
        if self.include_images:
            for root, dirs, files in os.walk(self.image_directory_path):
                for file in files:
                    if file.endswith(('png', 'jpg', 'jpeg')):
                        images_in_directory.append(os.path.join(root, file))
        submodule_content = []
        submodule_images=[]
        for key, val in submodule_split.items():
            if len(images_in_directory) >= 5:
                with ThreadPoolExecutor() as executor:
                    future_docs = executor.submit(self.search_text, val, top_k_docs)
                    future_images = executor.submit(self.search_image, val, images_in_directory)
                relevant_docs = future_docs.result()
                top_images = future_images.result()
                relevant_images = [DocumentUtils.image_to_base64(image_path) for image_path in top_images]
                if len(top_images) >= 2:
                    rel_docs = [doc.page_content for doc in relevant_docs]
                    context = '\n'.join(rel_docs)
                    image_explanation = await content_generator.generate_explanation_from_images(top_images[:2], val)
                    output = await content_generator.generate_content_from_textbook_and_images(self.course_name, module_name, self.lesson_type, val, profile, context, image_explanation)
                else:
                    rel_docs = [doc.page_content for doc in relevant_docs]
                    context = '\n'.join(rel_docs)
                    result_handler = ResultHandler.start()
                    try:
                        relevant_images, output = await asyncio.gather(
                            SerperProvider.submodule_image_from_web(val),
                            content_generator.generate_single_content_from_textbook(self.course_name, module_name, self.lesson_type, val, profile, context)
                        )
                        result_handler.tell(relevant_images)
                        result_handler.tell(output)
                    finally:
                        result_handler.stop()
            else:
                relevant_docs = self.search_text(val, top_k_docs)
                rel_docs = [doc.page_content for doc in relevant_docs]
                context = '\n'.join(rel_docs)
                result_handler = ResultHandler.start()
                try:
                    relevant_images, output = await asyncio.gather(
                        SerperProvider.submodule_image_from_web(val),
                        content_generator.generate_single_content_from_textbook(self.course_name, module_name, self.lesson_type, val, profile, context)
                    )
                    result_handler.tell(relevant_images)
                    result_handler.tell(output)
                finally:
                    result_handler.stop()
            submodule_content.append(output)
            submodule_images.append(relevant_images)
        return submodule_content, submodule_images
    
    async def run_with_web(self, content_generator : ContentGenerator, tavily_client: TavilyProvider, module_name : str, submodule_split : dict, profile : str, top_k_docs : int):
        images_in_directory = []
        if self.include_images:
            for root, dirs, files in os.walk(self.image_directory_path):
                for file in files:
                    if file.endswith(('png', 'jpg', 'jpeg')):
                        images_in_directory.append(os.path.join(root, file))
        submodule_content = []
        submodule_images=[]
        for key, val in submodule_split.items():
            tavily_query = self.course_name + " : " + val
            if len(images_in_directory) >= 5:
                with ThreadPoolExecutor() as executor:
                    future_docs = executor.submit(self.search_text, val, top_k_docs)
                    future_images = executor.submit(self.search_image, val, images_in_directory)
                    future_web_context = executor.submit(tavily_client.search_context, tavily_query)
                relevant_docs = future_docs.result()
                top_images = future_images.result()
                web_context = future_web_context.result()
                relevant_images = [DocumentUtils.image_to_base64(image_path) for image_path in top_images]
                if len(top_images) >= 2:
                    rel_docs = [doc.page_content for doc in relevant_docs]
                    context = '\n'.join(rel_docs)
                    image_explanation = await content_generator.generate_explanation_from_images(top_images[:2], val)
                    output = await content_generator.generate_content_from_textbook_and_images_with_web(self.course_name, module_name, self.lesson_type, val, profile, context, image_explanation, web_context)
                else:
                    rel_docs = [doc.page_content for doc in relevant_docs]
                    context = '\n'.join(rel_docs)
                    result_handler = ResultHandler.start()
                    try:
                        relevant_images, output = await asyncio.gather(
                            SerperProvider.submodule_image_from_web(val),
                            content_generator.generate_single_content_from_textbook_with_web(self.course_name, module_name, self.lesson_type, val, profile, context, web_context)
                        )
                        result_handler.tell(relevant_images)
                        result_handler.tell(output)
                    finally:
                        result_handler.stop()
            else:
                with ThreadPoolExecutor() as executor:
                    future_docs = executor.submit(self.search_text, val, top_k_docs)
                    future_web_context = executor.submit(tavily_client.search_context, tavily_query)
                relevant_docs = future_docs.result()
                web_context = future_web_context.result()
                rel_docs = [doc.page_content for doc in relevant_docs]
                context = '\n'.join(rel_docs)
                result_handler = ResultHandler.start()
                try:
                    relevant_images, output = await asyncio.gather(
                        SerperProvider.submodule_image_from_web(val),
                        content_generator.generate_single_content_from_textbook_with_web(self.course_name, module_name, self.lesson_type, val, profile, context, web_context)
                    )
                    result_handler.tell(relevant_images)
                    result_handler.tell(output)
                finally:
                    result_handler.stop()
            submodule_content.append(output)
            submodule_images.append(relevant_images)
        return submodule_content, submodule_images
    
    async def execute(self, content_generator, tavily_client, module_name, submodules: dict, profile, top_k_docs=5, search_web=False):
        keys_list = list(submodules.keys())
        submodules_split_one = {key: submodules[key] for key in keys_list[:2]}
        submodules_split_two = {key: submodules[key] for key in keys_list[2:4]}
        submodules_split_three = {key: submodules[key] for key in keys_list[4:]}
        result_handler = ResultHandler.start()

        try:
            if search_web:
                with ThreadPoolExecutor() as executor:
                    tasks = [
                        executor.submit(asyncio.run, self.run_with_web(content_generator=content_generator, tavily_client=tavily_client, module_name=module_name, submodule_split=submodules_split_one, profile=profile, top_k_docs=top_k_docs)),
                        executor.submit(asyncio.run, self.run_with_web(content_generator=content_generator, tavily_client=tavily_client, module_name=module_name, submodule_split=submodules_split_two, profile=profile, top_k_docs=top_k_docs)),
                        executor.submit(asyncio.run, self.run_with_web(content_generator=content_generator, tavily_client=tavily_client, module_name=module_name, submodule_split=submodules_split_three, profile=profile, top_k_docs=top_k_docs)),
                    ]
                    results = [task.result() for task in tasks]
            else:
                with ThreadPoolExecutor() as executor:
                    tasks = [
                        executor.submit(asyncio.run, self.run(content_generator, module_name, submodules_split_one, profile, top_k_docs)),
                        executor.submit(asyncio.run, self.run(content_generator, module_name, submodules_split_two, profile, top_k_docs)),
                        executor.submit(asyncio.run, self.run(content_generator, module_name, submodules_split_three, profile, top_k_docs)),
                    ]
                    results = [task.result() for task in tasks]

            content = []
            images = []
            for content_part, images_part in results:
                content.extend(content_part)
                images.extend(images_part)
                result_handler.tell((content_part, images_part))

        finally:
            result_handler.stop()

        return content, images