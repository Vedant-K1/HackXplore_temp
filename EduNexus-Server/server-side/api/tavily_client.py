import os
from dotenv import load_dotenv
from tavily import TavilyClient, AsyncTavilyClient

load_dotenv()
tavily_api_key1 = os.getenv('TAVILY_API_KEY1')
tavily_api_key2 = os.getenv('TAVILY_API_KEY2')
tavily_api_key3 = os.getenv('TAVILY_API_KEY3')

class TavilyProvider:
    def __init__(self, flag=1):
        active_api = tavily_api_key1 if flag==1 else(tavily_api_key2 if flag==2 else tavily_api_key3)
        self.tavily_client = TavilyClient(api_key = active_api)
        self.async_tavily_client = AsyncTavilyClient(api_key=active_api)

    def search_context(self, topic, search_depth="advanced", max_tokens=4000):
        search_results = self.tavily_client.get_search_context(topic, search_depth=search_depth, max_tokens=max_tokens)
        return search_results
    
    async def asearch_context(self, topic, search_depth="advanced", max_tokens=4000):
        search_results = await self.async_tavily_client.get_search_context(topic, search_depth=search_depth, max_tokens=max_tokens)
        return search_results