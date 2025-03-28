from api.gemini_client import GeminiProvider
from api.tavily_client import TavilyProvider

class ModuleGenerator:
    def __init__(self):
        self.gemini_client = GeminiProvider()
        self.tavily_client = TavilyProvider()

    def generate_module_summary(self, topic, level):
        prompt_module_generation = """You are an educational assistant with knowledge in various domains. You will be provided with a topic and your task is to generate suitable number of module names that are related to the topic and a brief summary on each module. Make sure that each Module name should not be a subset of any other modules. The difficulty and level of the modules that are generated should be of {level}. The output should be in json format where each key corresponds to the complete module name and the values are the brief summary of that module.
    ```
    Topic: {topic}
    ```"""
        output = self.gemini_client.generate_json_response(prompt_module_generation.format(topic=topic, level=level))
        return output
    
    def generate_module_summary_from_web(self, topic, level):
        search_result = self.tavily_client.search_context(topic)

        module_generation_prompt = """As an educational assistant, your goal is to craft a suitable number of {level} Level educational module names and brief summaries based on a given topic and search results. Ensure the module names are relevant to the topic and provide a concise summary for each. Format the output in JSON, with each key representing a complete module name and its corresponding value being the brief summary.

    Topic: {topic}

    Search Results: {search_result}

    Follow the provided JSON format diligently, incorporating information from the search results into the summaries and ensuring the modules are appropriately {level} in difficulty.
    """

        output = self.gemini_client.generate_json_response(module_generation_prompt.format(topic= topic, search_result = search_result, level = level))

        return output