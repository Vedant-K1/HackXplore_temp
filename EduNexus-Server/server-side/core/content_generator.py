import time

import PIL.Image
from api.gemini_client import GeminiProvider
from api.tavily_client import TavilyProvider

class ContentGenerator:
    def __init__(self):
        self.gemini_client = GeminiProvider()

    def generate_content(self, sub_modules : dict, module_name, course_name, api_key_to_use):
        prompt_content_gen = """I'm seeking your expertise on the sub-module : {sub_module_name} which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. Think about the sub-module step by step and design the best way to explain the sub-module to a student. Your response should cover essential aspects such as definition, in-depth examples, and any details crucial for understanding the topic. Please generate quality content on the sub-module ensuring the response is sufficiently detailed covering all the relevant topics related to the sub-module. In your response, organize the information into subsections for clarity and elaborate on each subsection with suitable examples if and only if it is necessary. Include specific hypothetical scenario-based examples(only if it is necessary) or important sub-sections related to the subject to enhance practical understanding. If applicable, incorporate real-world examples, applications or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps the student to better understand the topic. Ensure all the relevant aspects and topics related to the sub-module is covered in your response. Conclude your response by suggesting relevant URLs for further reading to empower users with additional resources on the subject. Please format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(an introduction of the sub-module), subsections (a list of dictionaries with keys - title and content), and urls (a list). Be a good educational assistant and craft the best way to explain the sub-module.Strictly, ensure that output shouldn't have any syntax errors and the given format is followed"""
        all_content = []
        flag = 1 if api_key_to_use== 'first' else (2 if api_key_to_use=='second' else 3 )
        print(f'THREAD {flag} RUNNING...')
        for key,val in sub_modules.items():
            content_output = self.gemini_client.generate_json_response(prompt_content_gen.format(sub_module_name = val, module_name = module_name, course_name=course_name))
            print("Thread 1: Module Generated: ",key,"!")   
            content_output['subject_name'] = val
            print(content_output)
            all_content.append(content_output)
        return all_content
    
    def generate_content_with_profile(self, sub_modules : dict, module_name, course_name, lesson_type, profile, api_key_to_use):
        theoretical_prompt = """I'm seeking your expertise on the sub-module : {sub_module_name} which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. Think about the sub-module step by step and design the best way to explain the sub-module to a student.  You will also be provided with my course requirements and needs inside <INSTRUCTIONS>. Structure the course according to my needs.\n<INSTRUCTIONS>\nMY COURSE REQUIREMENTS : {profile}\n</INSTRUCTIONS>\n\nYour response should cover essential aspects such as definition, in-depth examples, and any details crucial for understanding the topic. Please generate quality content on the sub-module ensuring the response is sufficiently detailed covering all the relevant topics related to the sub-module. In your response, organize the information into subsections for clarity and elaborate on each subsection with suitable examples if and only if it is necessary. Include specific hypothetical scenario-based examples(only if it is necessary) or important sub-sections related to the subject to enhance practical understanding. If applicable, incorporate real-world examples, applications or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps the student to better understand the topic. Ensure all the relevant aspects and topics related to the sub-module is covered in your response. Conclude your response by suggesting relevant URLs for further reading to empower users with additional resources on the subject. Please format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(an introduction of the sub-module), subsections (a list of dictionaries with keys - title and content), and urls (a list). Be a good educational assistant and craft the best way to explain the sub-module.Strictly, ensure that output shouldn't have any syntax errors and the given format is followed"""

        math_prompt = """I'm seeking your expertise on the mathematical sub-module: {sub_module_name} which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable mathematical assistant, I trust in your ability to provide a clear, structured, and comprehensive explanation of this sub-module. Think about the mathematical concepts step by step and develop the best method to explain this sub-module to a student. You will also be provided with my course requirements and needs inside <INSTRUCTIONS>. Structure the course according to my needs.\n<INSTRUCTIONS>\nMY COURSE REQUIREMENTS : {profile}\n</INSTRUCTIONS>\n\nYour response should address key aspects such as definitions, theorems, proofs, and practical problem-solving techniques. Break down complex topics into simpler parts, using appropriate notations and step-by-step calculations. Structure the content into well-defined sections that focus on conceptual understanding, followed by real-world applications if applicable. Where necessary, provide equations or solved problems to teach me. Include hypothetical or practical examples, illustrating the application of mathematical principles through problem-solving exercises. Offer detailed explanations of the solutions, emphasizing core methodologies and any common pitfalls. Ensure the response is sufficiently detailed, covering all essential mathematical concepts and related sub-topics. Conclude by suggesting relevant URLs for further exploration, enabling users to expand their knowledge. Format the output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content (an introduction of the sub-module), subsections (a list of dictionaries with keys - title and content), and urls (a list). Ensure that the output adheres strictly to the given format and does not contain any syntax errors."""

        technical_prompt = """I require your expertise on the sub-module: {sub_module_name}, which is a component of the larger module: {module_name}, part of the course: {course_name}. As a technical educational assistant, I expect you to provide a detailed and methodical explanation of the sub-module. Break down the sub-module systematically and design the most effective approach for conveying its technical aspects to a student. You will also be provided with the course-specific requirements and constraints within <INSTRUCTIONS>. Please structure your explanation to align with these specifications.\n\n<INSTRUCTIONS>\nMY COURSE REQUIREMENTS: {profile}\n</INSTRUCTIONS>\n\nYour response should cover the core technical concepts, key algorithms, methods, and any other essential components for understanding the sub-module. Ensure a comprehensive breakdown of the topic, using formal definitions, rigorous technical examples, and any necessary details for full comprehension. Where relevant, include specific code snippets, logical steps, or mathematical derivations to enhance understanding. You are encouraged to present complex scenarios, test cases, or system-level examples (if applicable) that illustrate how the sub-module fits within a broader technical context. The goal is to give the student a robust understanding of the topic through relevant applications, debugging scenarios, or performance considerations.\n\nFor better clarity, organize your response into logical subsections, elaborating on each with sufficient depth and clarity. Include explanations of technical terms, and where necessary, provide visualizations or workflows that might help in better understanding. If appropriate, also introduce potential pitfalls, trade-offs, or challenges that may arise when working with the sub-module.\n\nEnsure that the explanation covers the full breadth of the sub-module, including edge cases, common errors, and debugging tips. Conclude by providing URLs to trusted technical resources, documentation, or reference materials to offer the student further insights and tools for mastering the subject.\n\nPlease structure your output as valid JSON, using the following keys:\n- title_for_the_content: (a suitable, precise title for the sub-module)\n- content: (a technical overview of the sub-module)\n- subsections: (an array of dictionaries with keys: title, content - detailing specific technical aspects of the sub-module)\n- urls: (an array of links to relevant documentation or resources)\n\nEnsure strict adherence to the output format and avoid any syntax errors. Your response should strictly maintain this structure and focus on the technical depth required for full comprehension of the sub-module."""

        if lesson_type == 'mathematical':
            prompt = math_prompt
        elif lesson_type == 'technical':
            prompt = technical_prompt
        else:
            prompt = theoretical_prompt    
        all_content = []
        flag = 1 if api_key_to_use== 'first' else (2 if api_key_to_use=='second' else 3 )
        print(f'THREAD {flag} RUNNING...')
        for key,val in sub_modules.items():
            content_output = self.gemini_client.generate_json_response(prompt.format(sub_module_name = val, module_name = module_name, course_name=course_name, profile=profile))
            print("Thread 1: Module Generated: ",key,"!")   
            content_output['subject_name'] = val
            print(content_output)
            all_content.append(content_output)
        return all_content
    
    def generate_content_from_web(self, sub_modules: dict, module_name, course_name, api_key_to_use):
        content_generation_prompt = """I'm seeking your expertise on the subject of {sub_module_name}, which falls under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, you must provide a response in strictly formatted JSON.\n\nYour response should cover key aspects such as definitions, in-depth examples, and essential details to ensure a comprehensive understanding. This content must be structured specifically for educational purposes.\n\n**IMPORTANT**:\n1. Your response must **strictly adhere to JSON format** as shown below.\n2. Ensure that the output includes all required fields as JSON keys: `title_for_the_content`, `content`, `subsections`, and `urls`.\n3. Each `subsection` should be structured with `title` and `content` fields only.\n\nCONTENT GENERATION :\nUsing the subject information provided, generate detailed and informative content for the sub-module. Cover essential aspects such as definitions, real-world examples, and relevant applications. If helpful, use hypothetical scenarios to enhance practical understanding.\n\nSUBJECT INFORMATION:\n```{search_result}```\n--------------------------------\n<INSTRUCTIONS>\n- Organize the information into subsections for clarity and elaborate on each subsection with suitable examples if and only if it is necessary. \n- Include specific hypothetical scenario-based examples (only if it is necessary) or important sub-sections related to the subject to enhance practical understanding. \n- If applicable, incorporate real-world examples, applications or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps the student to better understand the topic. \n- Ensure all the relevant aspects and topics related to the sub-module is covered in your response. \n- Conclude your response by suggesting relevant URLs for further reading to empower users with additional resources on the subject.\n- Format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(an introduction of the sub-module), subsections (a list of dictionaries with keys - title and content), and urls (a list). Follow the JSON format precisely, and ensure it is valid.\n</INSTRUCTIONS>\nYour JSON response should strictly follow the format given above. Failure to follow the exact JSON format will result in invalid output."""
        flag = 1 if api_key_to_use== 'first' else (2 if api_key_to_use=='second' else 3 )
        print(f'THREAD {flag} RUNNING...')
        tavily_client = TavilyProvider(flag)        
        all_content = []
        for key, val in sub_modules.items():    
            topic = course_name + "-" + module_name + " : " + val
            print('Searching content for module:', topic)
            search_result = tavily_client.search_context(topic)
            output = self.gemini_client.generate_json_response(content_generation_prompt.format(sub_module_name = val, search_result = search_result, module_name=module_name, course_name=course_name))
            print('Module Generated:', key, '!')
            output['subject_name'] = val
            print(output)
            all_content.append(output)
            time.sleep(3)

        return all_content
    
    def generate_content_from_web_with_profile(self, sub_modules: dict, module_name, course_name, lesson_type, profile, api_key_to_use):
        theoretical_prompt = """I'm seeking your expertise on the subject of {sub_module_name}, which falls under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, you must provide a response in strictly formatted JSON.\n\nYour response should cover key aspects such as definitions, in-depth examples, and essential details to ensure a comprehensive understanding. This content must be structured specifically for educational purposes.\n\n**IMPORTANT**:\n1. Your response must **strictly adhere to JSON format** as shown below.\n2. Ensure that the output includes all required fields as JSON keys: `title_for_the_content`, `content`, `subsections`, and `urls`.\n3. Each `subsection` should be structured with `title` and `content` fields only.\n\nCONTENT GENERATION :\nUsing the subject information provided, generate detailed and informative content for the sub-module. Cover essential aspects such as definitions, real-world examples, and relevant applications. If helpful, use hypothetical scenarios to enhance practical understanding.\n\nSUBJECT INFORMATION:\n```{search_result}```\n--------------------------------\n<INSTRUCTIONS>\n- Organize the information into subsections for clarity and elaborate on each subsection with suitable examples if and only if it is necessary. \n- Include specific hypothetical scenario-based examples (only if it is necessary) or important sub-sections related to the subject to enhance practical understanding. \n- If applicable, incorporate real-world examples, applications or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps the student to better understand the topic. \n- Ensure all the relevant aspects and topics related to the sub-module is covered in your response. \n- Conclude your response by suggesting relevant URLs for further reading to empower users with additional resources on the subject.\n- Format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(an introduction of the sub-module), subsections (a list of dictionaries with keys - title and content), and urls (a list). Follow the JSON format precisely, and ensure it is valid.\n- Follow the course requirements so I can better understand the topic.\n**Course Requirements**:{profile}\n</INSTRUCTIONS>\nYour JSON response should strictly follow the format given above. Failure to follow the exact JSON format will result in invalid output."""

        math_prompt = """I'm seeking your expertise on the mathematical sub-module: {sub_module_name}, which falls under the module: {module_name}. This module is part of the course: {course_name}. As a knowledgeable educational assistant, you must provide a response in strictly formatted JSON.  

Your response should address key mathematical concepts such as definitions, theorems, proofs, step-by-step problem-solving techniques, and relevant applications. The content must be structured to facilitate learning, ensuring clarity and depth.  

**IMPORTANT**:  
1. Your response must **strictly adhere to JSON format** as shown below.  
2. Ensure that the output includes all required fields as JSON keys: `title_for_the_content`, `content`, `subsections`, and `urls`.  
3. Each `subsection` should be structured with `title` and `content` fields only.  

CONTENT GENERATION:  
Using the provided mathematical subject information, generate detailed and structured content. Include precise definitions, breakdowns of complex topics, real-world applications, and illustrative problem-solving examples where necessary. Provide proofs and step-by-step walkthroughs for mathematical operations to enhance understanding.  

SUBJECT INFORMATION:  
```{search_result}```  
--------------------------------  
<INSTRUCTIONS>  
- Structure the information into clearly defined subsections. Elaborate on each subsection with suitable examples, theorems, or hypothetical problems if necessary.  
- Use scenario-based examples or important sub-sections to explain key mathematical principles practically.  
- Where relevant, include graphs, equations, or diagrams to illustrate abstract concepts.  
- Highlight real-world applications, demonstrating how the mathematical concept is used in engineering, science, or technology.  
- Ensure comprehensive coverage of all related aspects and sub-topics.  
- Conclude by suggesting URLs for further reading to encourage deeper exploration of the topic.  
- Format the response as valid JSON, with the following keys:  
  - `title_for_the_content`: A suitable title for the sub-module  
  - `content`: An introduction or overview of the sub-module  
  - `subsections`: A list of dictionaries containing `title` and `content` for each section  
  - `urls`: A list of URLs for further reading  
- Ensure the JSON is properly formatted and error-free.  
- Align the content with the course requirements for enhanced comprehension.  
**Course Requirements**: {profile}  
</INSTRUCTIONS>  
Your JSON response should strictly follow the format given above. Any deviation will result in invalid output.  
"""

        technical_prompt = """I require your expertise on the technical subject of {sub_module_name}, which is a component of the module: {module_name}, and part of the course: {course_name}. As a technical educational assistant, you must provide a detailed response in **strictly formatted JSON**.

Your response should address key technical aspects such as definitions, in-depth examples, algorithms, formulas, methods, and essential details required to ensure a comprehensive understanding of the sub-module. The content should be structured specifically for educational and technical purposes.

**IMPORTANT**:
1. Your response must **strictly adhere to JSON format** as shown below.
2. Ensure that the output includes all required fields as JSON keys: `title_for_the_content`, `content`, `subsections`, and `urls`.
3. Each `subsection` should be structured with `title` and `content` fields only.

CONTENT GENERATION:
Using the provided subject information, generate detailed, technically accurate, and informative content. Address essential aspects such as definitions, code snippets, algorithms, real-world applications, and any relevant use cases. You may include hypothetical technical scenarios to enhance practical understanding, provided they are relevant to the subject. 

SUBJECT INFORMATION:
```{search_result}```

--------------------------------

<INSTRUCTIONS>
- Organize the technical content into logical subsections for clarity and ensure that each subsection is explained with sufficient technical detail.
- Provide code samples, formulas, or mathematical derivations where applicable to enhance the understanding of the sub-module.
- If necessary, include hypothetical scenario-based examples that relate to real-world use cases or system-level considerations (e.g., how the sub-module would be implemented or optimized in a real-world application).
- Ensure all technical aspects, edge cases, and possible pitfalls related to the sub-module are covered in your response.
- Conclude your response by suggesting relevant URLs for further technical reading or documentation to help the user deepen their understanding of the subject.
- Format your output as valid JSON with the following keys:
    - `title_for_the_content` (a technical title for the sub-module)
    - `content` (a technical introduction to the sub-module)
    - `subsections` (an array of dictionaries, each with a `title` and `content` detailing specific technical aspects)
    - `urls` (an array of URLs to relevant documentation, code examples, or further resources)

- Align the content with the course requirements for enhanced comprehension.  
**Course Requirements**: {profile}  

Your JSON response must strictly adhere to the format and structure given above. Any deviation from this format will result in invalid output.
"""
        if lesson_type == 'mathematical':
            prompt = math_prompt
        elif lesson_type == 'technical':
            prompt = technical_prompt
        else:
            prompt = theoretical_prompt 
        flag = 1 if api_key_to_use== 'first' else (2 if api_key_to_use=='second' else 3 )
        print(f'THREAD {flag} RUNNING...')
        tavily_client = TavilyProvider(flag)        
        all_content = []
        for key, val in sub_modules.items():    
            topic = course_name + "-" + module_name + " : " + val
            print('Searching content for module:', topic)
            search_result = tavily_client.search_context(topic)
            output = self.gemini_client.generate_json_response(prompt.format(sub_module_name = val, search_result = search_result, module_name=module_name, course_name=course_name, profile=profile))
            print('Module Generated:', key, '!')
            output['subject_name'] = val
            print(output)
            all_content.append(output)
            time.sleep(3)

        return all_content
    
    def generate_content_from_textbook(self, course_name, module_name, output:dict, profile, vectordb, api_key_to_use):
        prompt= """I'm seeking your expertise on the subject of {sub_module_name} which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. Think about the sub-module step by step and design the best way to explain the sub-module to me. Your response should cover essential aspects such as definition, in-depth examples, and any details crucial for understanding the topic. You have access to the subject's information which you have to use while generating the educational content. Please generate quality content on the sub-module ensuring the response is sufficiently detailed covering all the relevant topics related to the sub-module. You will also be provided with my course requirements and needs inside <INSTRUCTIONS>. Structure the course according to my needs.
    
    SUBJECT INFORMATION : ```{context}```

    <INSTRUCTIONS>
    MY COURSE REQUIREMENTS : {profile}
    </INSTRUCTIONS>

    In your response, organize the information into subsections for clarity and elaborate on each subsection with suitable examples if and only if it is necessary. If applicable, incorporate real-world examples, applications or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps me to better understand the topic. Please format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(the main content of the sub-module), subsections (a list of dictionaries with keys - title and content).
    Be a good educational assistant and craft the best way to explain the sub-module following my course requirement. Strictly follow the course requirements and output format provided to you.
    """

        all_content = []
        flag = 1 if api_key_to_use== 'first' else (2 if api_key_to_use=='second' else 3 )
        print(f'THREAD {flag} RUNNING...')
        for key,val in output.items():
            relevant_docs = vectordb.similarity_search(val)
            rel_docs = [doc.page_content for doc in relevant_docs]
            context = '\n'.join(rel_docs)
            content_output = self.gemini_client.generate_json_response(prompt.format(sub_module_name = val, module_name = module_name, profile= profile, context=context, course_name=course_name))
            print("Thread 1: Module Generated: ",key,"!")   
            content_output['subject_name'] = val
            print(content_output)
            all_content.append(content_output)

        return all_content
    
    async def generate_explanation_from_images(self, images, sub_module_name):
        prompt = f"""I am providing you with two images that relates to {sub_module_name}. Your role is to analyze the images in great detail and provide a comprehensive explanation that another language model will use to explain {sub_module_name}. Your explanation should be structured, covering:

Descriptive Elements: Identify and describe all visible elements such as objects, people, settings, colors, and activities. Include their physical characteristics and positioning.

Contextual Analysis: Relate these elements to the topic. Explain their significance, roles, or functions in the context of the subject matter.

Symbolism & Meaning: If the image contains any symbolism or metaphorical elements, explain what they represent and how they contribute to understanding the broader topic.

Technical Breakdown: If the image involves technical or specialized content (e.g., diagrams, charts, machinery), break it down step-by-step for clarity.

Logical Flow: Ensure your explanation is organized and flows logically to make it easier for another model to use this analysis to explain the broader topic effectively.

Provide as much detail as possible and aim to enrich the understanding of the images in the context of the topic. Explain both the images separately. Here are the two images:"""
        output = self.gemini_client.explain_two_image(prompt=prompt, image1_path=images[0], image2_path=images[1])
        return output
    
    async def generate_content_from_textbook_and_images(self, course_name, module_name, lesson_type, submodule_name, profile, context, image_explanation):
        theoretical_prompt= f"""I'm seeking your expertise on the subject of {submodule_name} which comes under the module: {module_name}. This module is part of the course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. You will be given explanations for two images related to the topic, and you must use these explanations effectively in your final response. The image explanations are meant to enhance your content, providing visual context and aiding in understanding the sub-module.

Please think about the sub-module step by step and design the best way to explain it to me. Your response should cover essential aspects such as definitions, in-depth examples, and any details crucial for understanding the topic. You have access to the subject's information, which you should use while generating the educational content. Ensure the response is sufficiently detailed, covering all relevant topics related to the sub-module. Structure the course according to my needs as provided.

SUBJECT INFORMATION:
{context}

Image Explanations:
{image_explanation}

<INSTRUCTIONS>
MY COURSE REQUIREMENTS:
{profile}
</INSTRUCTIONS>

In your response, organize the information into subsections for clarity, and elaborate on each subsection with suitable examples if and only if necessary. Make sure to integrate the image explanations into your content, explaining how they relate to and support the sub-module. If any image explanation is irrelevant, do not include them in the response. If applicable, incorporate real-world examples, applications, or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps me better understand the topic. Please format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(the main content of the sub-module), subsections (a list of dictionaries with keys - title and content). Be a good educational assistant and craft the best way to explain the sub-module following my course requirement. Strictly follow the course requirements and output format provided to you.
    """
        
        math_prompt = f"""I'm seeking your expertise on the mathematical sub-module: {submodule_name}, which comes under the module: {module_name}. This module is part of the course: {course_name}. As a knowledgeable mathematical assistant, I trust in your ability to provide a comprehensive and structured explanation of this sub-module. You will be provided with explanations for two images that visually represent mathematical concepts related to the topic. Use these explanations effectively to enhance the clarity and depth of the final response. The image explanations should reinforce theoretical content and offer visual aids to facilitate understanding.  

Please approach the sub-module step by step, and design the best method to explain it to me. Cover essential mathematical aspects such as definitions, theorems, proofs, derivations, and problem-solving techniques crucial to mastering the topic. Leverage the subject's information to generate thorough educational content, ensuring comprehensive coverage of all relevant topics related to the sub-module. Structure the explanation to align with my course requirements.  

SUBJECT INFORMATION:  
{context}  

Image Explanations:  
{image_explanation}  

<INSTRUCTIONS>  
MY COURSE REQUIREMENTS:  
{profile}  
</INSTRUCTIONS>  

In your response, organize the information into clear subsections and elaborate on each part with step-by-step examples, derivations, or hypothetical problems if necessary. Incorporate the image explanations by linking them directly to mathematical operations, graphs, formulas, or proofs, explaining how they enhance the understanding of the sub-module. If any image explanation does not align with the content, exclude it.  

Where applicable, integrate real-world applications of the mathematical concept, such as its use in physics, engineering, economics, or computer science. Provide worked-out examples to demonstrate problem-solving methodologies, ensuring students gain practical insights.  

Please format your output as valid JSON, with the following keys:  
- `title_for_the_content` – A suitable title for the sub-module  
- `content` – The main content that introduces and explains the sub-module  
- `subsections` – A list of dictionaries containing `title` and `content` fields for each section  

Craft the explanation carefully to meet my course requirements and educational goals. Ensure that the output follows the JSON format strictly without errors, and structure the response for maximum clarity and engagement.  
"""
        technical_prompt = f"""I require your expertise on the technical subject of {submodule_name}, which is part of the module: {module_name} and belongs to the course: {course_name}. As a technical educational assistant, I trust in your ability to provide a comprehensive, technically accurate explanation of this sub-module. You will be provided with explanations for two images related to the topic. These image explanations should be incorporated effectively into your response, using them to provide additional context and support for the technical concepts.

Please break down the sub-module step by step and structure your response to address the core technical elements. Your response should include detailed explanations of key concepts, algorithms, methods, and any other technical components that are crucial for understanding the sub-module. The explanation should be sufficiently detailed to ensure the topic is fully covered, and should integrate the provided image explanations where applicable.

You have access to the subject's information, which should be used in generating the technical content. Additionally, incorporate relevant examples, code snippets, use cases, or real-world applications to further explain the technical aspects of the sub-module.

SUBJECT INFORMATION:
{context}

Image Explanations:
{image_explanation}

<INSTRUCTIONS>
MY COURSE REQUIREMENTS:
{profile}
</INSTRUCTIONS>

In your response, organize the content into subsections for clarity, and elaborate on each subsection with suitable examples, including any code or technical details when necessary. Ensure that the image explanations are integrated into the content, showing how the images support or explain specific technical aspects of the sub-module. If an image explanation is not relevant to the sub-module, do not include it in the response. Use hypothetical scenarios, real-world applications, or system-level examples as needed to demonstrate the technical significance of the sub-module.

Please format your output as valid JSON, with the following keys:
- `title_for_the_content` (a technical title for the sub-module)
- `content` (the main technical content for the sub-module)
- `subsections` (a list of dictionaries with keys: `title` and `content`—detailing the specific technical components)

Strictly follow the output format provided above. The response must be technically rigorous, and any deviations from the requested format will result in invalid output.
"""
        if lesson_type == 'mathematical':
            prompt = math_prompt
        elif lesson_type == 'technical':
            prompt = technical_prompt
        else:    
            prompt = theoretical_prompt

        content_output = self.gemini_client.generate_json_response(prompt) 
        content_output['subject_name'] = submodule_name
        print(content_output)

        return content_output
    
    async def generate_single_content_from_textbook(self, course_name, module_name, lesson_type, submodule_name, profile, context):
        theoretical_prompt= f"""I'm seeking your expertise on the subject of {submodule_name} which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. Think about the sub-module step by step and design the best way to explain the sub-module to me. Your response should cover essential aspects such as definition, in-depth examples, and any details crucial for understanding the topic. You have access to the subject's information which you have to use while generating the educational content. Please generate quality content on the sub-module ensuring the response is sufficiently detailed covering all the relevant topics related to the sub-module. You will also be provided with my course requirements and needs inside <INSTRUCTIONS>. Structure the course according to my needs.
    
    SUBJECT INFORMATION : ```{context}```

    <INSTRUCTIONS>
    MY COURSE REQUIREMENTS : {profile}
    </INSTRUCTIONS>

    In your response, organize the information into subsections for clarity and elaborate on each subsection with suitable examples if and only if it is necessary. If applicable, incorporate real-world examples, applications or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps me to better understand the topic. Please format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(the main content of the sub-module), subsections (a list of dictionaries with keys - title and content).
    Be a good educational assistant and craft the best way to explain the sub-module following my course requirement. Strictly follow the course requirements and output format provided to you.
    """
        
        math_prompt = f"""I'm seeking your expertise on the mathematical sub-module: {submodule_name}, which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable mathematical assistant, I trust in your ability to provide a clear and comprehensive explanation of this sub-module. Break down the sub-module step by step, designing the best method to explain it to me.  

Your response should address essential aspects such as definitions, theorems, proofs, derivations, and detailed examples that are critical for understanding the topic. Utilize the provided subject information to generate accurate and detailed educational content. Ensure that the response thoroughly covers all mathematical concepts, techniques, and subtopics related to the sub-module.  

SUBJECT INFORMATION : ```{context}```  

<INSTRUCTIONS>  
MY COURSE REQUIREMENTS : {profile}  
</INSTRUCTIONS>  

Organize the information into structured subsections for clarity. Elaborate on each subsection with step-by-step derivations, equations, or examples if necessary. If applicable, include real-world mathematical applications, scenarios, or problem-solving techniques to highlight the relevance of the topic in practical contexts (e.g., physics, engineering, computer science).  

Ensure complex concepts are simplified and well-explained. Address how each part connects to the broader mathematical framework or module.  

Please format your output as valid JSON, using the following keys:  
- `title_for_the_content` – A concise, suitable title for the sub-module  
- `content` – An introduction or overview of the sub-module  
- `subsections` – A list of dictionaries, each containing `title` and `content` fields to organize different parts of the explanation  

Craft the explanation carefully, adhering to my course requirements and learning goals. Ensure the output strictly follows the provided JSON format without errors.  
"""
        technical_prompt = f"""I require your expertise on the technical subject of {submodule_name}, which is part of the module: {module_name}, and belongs to the course: {course_name}. As a technical educational assistant, I trust in your ability to provide a comprehensive, technically accurate explanation of this sub-module. Break down the sub-module step by step, ensuring that the response is logically structured to explain all key technical components. Your response should cover essential aspects such as definitions, algorithms, methods, code examples, and any other technical details crucial for understanding the topic. 

You will be provided with the subject's information, which you must use in generating the technical content. Additionally, you will receive my course requirements, which should guide the structure of the content.

SUBJECT INFORMATION: ```{context}```

<INSTRUCTIONS>
MY COURSE REQUIREMENTS: {profile}
</INSTRUCTIONS>

In your response:
- Organize the content into clear subsections for logical flow.
- Elaborate on each subsection with detailed examples, code snippets, or formulas as necessary.
- If applicable, include technical use cases, real-world examples, or practical applications that illustrate the relevance and implementation of the sub-module.
- Ensure all key technical aspects and edge cases are covered thoroughly.

Please format your output as valid JSON, with the following keys:
- `title_for_the_content` (a technical title for the sub-module)
- `content` (the main technical content for the sub-module)
- `subsections` (a list of dictionaries, each with keys: `title` and `content`—detailing specific technical components)

Ensure your response is detailed, technically rigorous, and strictly follows the format specified above. Any deviation from this format or failure to cover all required technical details will result in invalid output.
"""

        if lesson_type == 'mathematical':
            prompt = math_prompt
        elif lesson_type == 'technical':
            prompt = technical_prompt
        else:    
            prompt = theoretical_prompt
        content_output = self.gemini_client.generate_json_response(prompt) 
        content_output['subject_name'] = submodule_name
        print(content_output)

        return content_output
    
    async def generate_content_from_textbook_and_images_with_web(self, course_name, module_name, lesson_type, submodule_name, profile, context, image_explanation, web_context):
        theoretical_prompt = f"""I'm seeking your expertise on the subject of {submodule_name} which comes under the module: {module_name}. This module is a part ofthe course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. You will be given explanations for two images and some web context related to the topic, and you must use these effectively in your final response. The image explanations and web context are meant to enhance your content, providing additional visual and contextual understanding for the sub-module.

    Please think about the sub-module step by step and design the best way to explain it to me. Your response should cover essential aspects such as definitions, in-depth examples, and any details crucial for understanding the topic. You have access to the subject's information from the textbook, images, and web context, which you should use while generating the educational content. Ensure the response is sufficiently detailed, covering all relevant topics related to the sub-module. Structure the course according to my needs as provided.

    **SUBJECT INFORMATION**:
    {context}

    **Image Explanations**:
    {image_explanation}

    **Web Context**:
    {web_context}

    <INSTRUCTIONS>
    - Follow the course requirements so I can better understand the topic.
    **Course Requirements**:
    {profile}
    </INSTRUCTIONS>

    In your response, organize the information into subsections for clarity, and elaborate on each subsection with suitable examples if and only if necessary. Make sure to integrate the image explanations and web context into your content, explaining how they relate to and support the sub-module. If applicable, incorporate real-world examples, applications, or use-cases to illustrate the relevance of the topic in various contexts. Additionally, incorporate anything that helps me better understand the topic. Please format your output as valid JSON, with the following keys: title_for_the_content (suitable title for the sub-module), content(the main content of the sub-module), subsections (a list of dictionaries with keys - title and content). Be a good educational assistant and craft the best way to explain the sub-module following my course requirement. Strictly follow the course requirements and output format provided to you.
        """

        math_prompt = f"""I'm seeking your expertise on the mathematical sub-module: {submodule_name}, which comes under the module: {module_name}. This module is part of the course: {course_name}. As a knowledgeable mathematical assistant, I trust in your ability to provide a comprehensive and structured explanation of this sub-module. You will be provided with explanations for two images and relevant web context related to the topic. Use these resources effectively to enhance the clarity and accuracy of the response. The image explanations and web context are intended to provide additional visual and contextual insights to support the learning process.  

Please think about the sub-module step by step, and develop the best approach to explain it to me. Cover essential mathematical aspects such as definitions, theorems, proofs, derivations, and examples that are crucial for understanding the topic. Use the provided subject information, images, and web context to ensure the educational content is thorough and detailed, covering all relevant concepts related to the sub-module. Structure the course content according to my specific requirements.  

**SUBJECT INFORMATION**:  
{context}  

**Image Explanations**:  
{image_explanation}  

**Web Context**:  
{web_context}  

<INSTRUCTIONS>  
- Follow the course requirements so I can better understand the topic.  
**Course Requirements**:  
{profile}  
</INSTRUCTIONS>  

Organize the explanation into well-defined subsections for clarity. Elaborate on each subsection with mathematical derivations, step-by-step proofs, and problem-solving techniques if necessary. Ensure that the image explanations and web context are seamlessly integrated into the content, illustrating their connection to mathematical concepts, graphs, or formulas. If any image or web context is irrelevant, omit it.  

If applicable, provide real-world examples, applications, or use-cases to demonstrate the practical relevance of the mathematical concept (e.g., physics, engineering, data science).

Format the output as valid JSON with the following keys:  
- `title_for_the_content` – A suitable, concise title for the sub-module  
- `content` – A detailed introduction and overview of the sub-module  
- `subsections` – A list of dictionaries containing `title` and `content` fields for each section, covering important topics  

Ensure the explanation is crafted carefully, following my course requirements and goals. Adhere strictly to the JSON format to ensure the output is valid and error-free.  
"""
        
        technical_prompt = f"""I require your expertise on the technical subject of {submodule_name}, which is part of the module: {module_name}, and belongs to the course: {course_name}. As a technical educational assistant, I trust in your ability to provide a comprehensive, technically accurate explanation of this sub-module. You will be given explanations for two images and some web context related to the topic, and you must use these effectively in your final response. The image explanations and web context are intended to enhance your content by providing visual and contextual support for understanding the technical aspects of the sub-module.

Please break down the sub-module step by step, ensuring that your response is logically structured to cover all key technical components. Your response should address essential aspects such as definitions, algorithms, code examples, methods, and other technical details necessary to fully understand the sub-module. You have access to the subject's information from the textbook, images, and web context, all of which should be utilized to generate a complete, educationally effective response.

**SUBJECT INFORMATION**:
{context}

**Image Explanations**:
{image_explanation}

**Web Context**:
{web_context}

<INSTRUCTIONS>
- Follow the course requirements to ensure that the explanation meets the educational needs for a clear technical understanding.
**Course Requirements**:
{profile}
</INSTRUCTIONS>

In your response:
- Organize the content into clear subsections for easy understanding.
- Elaborate on each subsection with detailed technical examples, code snippets, algorithms, or formulas as needed.
- Make sure to integrate the provided image explanations and web context into your content, explaining how each visual and web resource enhances the understanding of the sub-module’s technical aspects.
- If relevant, provide real-world technical use cases, system-level applications, or examples that demonstrate how the sub-module is used in practice.
- Include any additional insights that will help improve my understanding of the technical concepts.

Please format your output as valid JSON, with the following keys:
- `title_for_the_content` (a technical title for the sub-module)
- `content` (the main technical content of the sub-module)
- `subsections` (a list of dictionaries, each containing `title` and `content` detailing specific technical aspects of the sub-module)

Ensure your response is technically rigorous, and strictly follow the output format provided. Any deviations from the format or failure to cover key technical details will result in invalid output.
"""

        if lesson_type == 'mathematical':
            prompt = math_prompt
        elif lesson_type == 'technical':
            prompt = technical_prompt
        else:
            prompt = theoretical_prompt
        content_output = self.gemini_client.generate_json_response(prompt) 
        content_output['subject_name'] = submodule_name
        print(content_output)

        return content_output

    async def generate_single_content_from_textbook_with_web(self, course_name, module_name, lesson_type, submodule_name, profile, context, web_context):
        theoretical_prompt = f"""I'm seeking your expertise on the subject of {submodule_name} which comes under the module: {module_name}. This module is a part of the course: {course_name}. As a knowledgeable educational assistant, I trust in your ability to provide a comprehensive explanation of this sub-module. You will have access to subject information from the textbook and relevant web-based context to create a well-rounded educational response. Think about the sub-module step by step and design the best way to explain it to me.

    Your response should cover essential aspects such as definition, in-depth examples, and any details crucial for understanding the topic. Use both the textbook information and web context effectively while generating the educational content. Please ensure that your response is sufficiently detailed, covering all relevant topics. Structure the course content according to my specific needs provided in <INSTRUCTIONS>.

    SUBJECT INFORMATION:
    {context}

    WEB CONTEXT:
    {web_context}

    <INSTRUCTIONS>
    MY COURSE REQUIREMENTS:
    {profile}
    </INSTRUCTIONS>

    In your response, organize the information into subsections for clarity, and elaborate on each subsection with suitable examples only if necessary. Where applicable, include real-world examples, applications, or use-cases to illustrate the topic's relevance in various contexts. Additionally, incorporate any explanations that help me better understand the topic. Please format your output as valid JSON, with the following keys: title_for_the_content (a suitable title for the sub-module), content (the main content of the sub-module), and subsections (a list of dictionaries with keys - title and content). 

    Be a good educational assistant and craft the best way to explain the sub-module following my course requirements. Strictly follow the course requirements and output format provided to you.
    """
        
        math_prompt = f"""I'm seeking your expertise on the mathematical sub-module: {submodule_name}, which comes under the module: {module_name}. This module is part of the course: {course_name}. As a knowledgeable mathematical assistant, I trust in your ability to provide a clear, structured, and comprehensive explanation of this sub-module. You will have access to textbook information and relevant web-based context to create a well-rounded and accurate mathematical response. Break down the sub-module step by step and design the most effective way to explain the topic to me.  

Your response should cover essential mathematical aspects such as definitions, theorems, proofs, derivations, and detailed examples crucial for understanding the topic. Use both the textbook information and web context effectively to ensure the content is complete and accurate. Please ensure your response is sufficiently detailed, addressing all necessary mathematical concepts and subtopics. Structure the course content according to the specific needs outlined in <INSTRUCTIONS>.  

**SUBJECT INFORMATION**:  
{context}  

**WEB CONTEXT**:  
{web_context}  

<INSTRUCTIONS>  
MY COURSE REQUIREMENTS:  
{profile}  
</INSTRUCTIONS>  

Organize the explanation into well-defined subsections for clarity. Provide derivations, proofs, and step-by-step examples where necessary. If applicable, include real-world mathematical applications or scenarios to illustrate the practical use of the topic (e.g., physics, engineering, economics).

Where relevant, introduce problem-solving techniques and include hypothetical examples or case studies to reinforce key points. Ensure that complex mathematical ideas are broken down into understandable segments.  

Please format your output as valid JSON with the following keys:  
- `title_for_the_content` – A suitable, concise title for the sub-module  
- `content` – A detailed introduction and overview of the sub-module  
- `subsections` – A list of dictionaries containing `title` and `content` fields for each section, addressing critical topics and explanations  

Craft the explanation carefully to align with my course requirements and goals. Strictly follow the output format and ensure the JSON is error-free and correctly structured.  
"""
        
        technical_prompt = f"""I require your expertise on the technical subject of {submodule_name}, which is part of the module: {module_name}, and belongs to the course: {course_name}. As a technical educational assistant, I trust in your ability to provide a comprehensive, technically accurate explanation of this sub-module. You will have access to subject information from the textbook and relevant web-based context, and you should leverage both to create a well-rounded and detailed technical response.

Please break down the sub-module step by step, structuring your explanation logically to cover all key technical components. Your response should address essential technical aspects such as definitions, algorithms, methods, code examples, formulas, and any other details crucial for understanding the sub-module. Use both the textbook information and web context effectively while generating the technical content.

**SUBJECT INFORMATION**:
{context}

**WEB CONTEXT**:
{web_context}

<INSTRUCTIONS>
MY COURSE REQUIREMENTS:
{profile}
</INSTRUCTIONS>

In your response:
- Organize the technical content into clear subsections for clarity.
- Elaborate on each subsection with detailed technical explanations, code samples, algorithms, or formulas as necessary.
- Where applicable, include real-world examples, applications, or use cases to illustrate the technical concepts and their relevance in practical scenarios.
- Integrate the provided textbook information and web context into your response, explaining how each resource supports the technical understanding of the sub-module.
- Include any additional technical insights that will help improve my understanding of the subject.

Please format your output as valid JSON with the following keys:
- `title_for_the_content` (a technical title for the sub-module)
- `content` (the main technical content of the sub-module)
- `subsections` (a list of dictionaries, each containing `title` and `content` detailing specific technical aspects)
- `urls` (optional list of URLs to relevant documentation or technical resources)

Ensure your response is detailed, technically accurate, and adheres strictly to the output format. Any deviation from the format or failure to include key technical components will result in invalid output.
"""
        if lesson_type == 'mathematical':
            prompt = math_prompt
        elif lesson_type == 'technical':
            prompt = technical_prompt
        else:
            prompt = theoretical_prompt

        content_output = self.gemini_client.generate_json_response(prompt)
        content_output['subject_name'] = submodule_name
        print(content_output)

        return content_output
