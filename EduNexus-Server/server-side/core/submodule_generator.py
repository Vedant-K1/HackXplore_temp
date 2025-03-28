from api.gemini_client import GeminiProvider
from api.tavily_client import TavilyProvider
import asyncio
from langchain_community.vectorstores import FAISS

class SubModuleGenerator:
    def __init__(self):
        self.gemini_client = GeminiProvider()
        self.tavily_client = TavilyProvider()

    def generate_submodules(self, module_name):
        prompt_submodules = f"""You are an educational assistant having knowledge in various domains. You will be provided with a module name and your task is to generate six 'Sub-Modules' names that are related to the module. The output should be in json format where each key corresponds to the sub-module number and the values are the sub-module names.\n**Module Name**: {module_name}."""
        prompt_submodules += """The output should be a dictionary as given in the below example. The output should be similar to the provided example. Do not change the structure of the output strictly.\n# EXAMPLE OUTPUT FORMAT: \n{ {"1": "Data Retrieval Methods"}, {"2": "Knowledge Base Construction"} }"""
        output = self.gemini_client.generate_json_response(prompt_submodules)
        return output

    def generate_submodules_from_web(self, module_name, course_name):
        topic = module_name +" : " +course_name
        search_result = self.tavily_client.search_context(topic)

        sub_module_generation_prompt= f"""You are an educational assistant named ISAAC. You will be provided with a module name and information on that module from the internet. Your task is to generate six 'Sub-Modules' names that are related to the modules. The output should be in json format where each key corresponds to the sub-module number and the values are the sub-module names.\n\n**Module Name**: {module_name}.\n\n**Search Results**: ```{search_result}```\n\n"""
        sub_module_generation_prompt += """# EXAMPLE OUTPUT FORMAT:\n{ {"1": "Data Retrieval Methods"}, {"2": "Knowledge Base Construction"} }\nFollow the provided JSON format diligently."""
        output = self.gemini_client.generate_json_response(sub_module_generation_prompt)
        return output
    
    def generate_submodules_from_textbook(self, topic, vectordb : FAISS):
        relevant_docs = vectordb.similarity_search('Important topics on '+ topic)
        rel_docs = [doc.page_content for doc in relevant_docs]
        context = '\n'.join(rel_docs)
        module_generation_prompt = f"""You are an educational assistant with knowledge in various domains. A student is seeking your expertise to learn a given topic. You will be provided with context from their textbook and your task is to design course modules to complete all the major concepts about the topic in the textbook. Craft six module names for the student to learn the topic they wish. Ensure the module names are relevant to the topic using the context provided to you. You MUST only use the knowledge provided in the context to craft the module names. The output should be in json format where each key corresponds to the sub-module number and the values are the sub-module names. Do not consider summary or any irrelevant topics as module names.\n\n**Topic**: {topic}\n\n**Context**: ```{context}```\n\n"""
        module_generation_prompt += """# EXAMPLE OUTPUT FORMAT:\n{ {"1": "Data Retrieval Methods"}, {"2": "Knowledge Base Construction"} }\nFollow the provided JSON format diligently."""

        output = self.gemini_client.generate_json_response(module_generation_prompt)
        return output
    
    async def generate_submodules_from_documents_and_web(self, module_name, course_name, vectordb : FAISS):
        topic = module_name +" : " +course_name
        web_context, relevant_docs = await asyncio.gather(
            self.tavily_client.asearch_context(topic),
            vectordb.asimilarity_search('Important topics on '+ module_name)
        )
        rel_docs = [doc.page_content for doc in relevant_docs]
        texbook_context = '\n'.join(rel_docs)

        module_generation_prompt = f"""You are an educational assistant with knowledge in various domains. A student is seeking your expertise to learn a given topic. You will be provided with context from their textbook as well the latest context from the internet. Your task is to design course modules to complete all the major concepts about the topic in the textbook. Craft six module names for the student to learn the topic they wish. Ensure the module names are relevant to the topic using both: the textbook context as well as the web context provided to you. The context might contain information that is irrelevant to the topic. You MUST only use the relevant knowledge from both the context and ignore the part which is irrelevant to the topic. \nn**Topic**: ```{topic}```\n\n**Textbook Context**: ```{texbook_context}```\n\n**Web Context**: ```{web_context}```\nThe output should be in json format where each key corresponds to the sub-module number and the values are the sub-module names. Do not consider summary or any irrelevant topics as module names.\n"""
        module_generation_prompt += """# EXAMPLE OUTPUT FORMAT:\n{ {"1": "Data Retrieval Methods"}, {"2": "Knowledge Base Construction"} }\nFollow the provided JSON format diligently."""
        output = self.gemini_client.generate_json_response(module_generation_prompt)
        return output