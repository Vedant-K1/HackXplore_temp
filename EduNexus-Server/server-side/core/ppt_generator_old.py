# from api.gemini_client import GeminiProvider
# from bs4 import BeautifulSoup
# from pptx import Presentation
# from pptx.util import Inches, Pt
# from pptx.enum.text import PP_ALIGN
# from pptx.dml.color import RGBColor
# from PIL import Image
# import base64
# import io
# import requests
# import re
# import ast
# import time
# import os
# import random
# from io import BytesIO

# class PptGenerator:
#     def __init__(self):
#         self.gemini_client = GeminiProvider()

#     @staticmethod
#     def parse_html_content(html_text):
#         soup = BeautifulSoup(html_text, 'html.parser')
#         parsed_content = []
#         processed_texts = set()  # Keep track of processed text content

#         for element in soup.find_all(['h1', 'h2', 'h3', 'p', 'ul', 'li', 'b', 'i', 'u']):
#             text_content = element.get_text().strip()
            
#             # Skip if we've already processed this exact text
#             if text_content in processed_texts:
#                 continue
                
#             if element.name in ['h1', 'h2', 'h3']:
#                 parsed_content.append({
#                     'text': text_content,
#                     'style': 'header',
#                     'level': int(element.name[1])
#                 })
#                 processed_texts.add(text_content)
                
#             elif element.name == 'p':
#                 # Only process paragraphs that aren't already part of a formatted element
#                 if not element.find_parent(['b', 'i', 'u']):
#                     parsed_content.append({
#                         'text': text_content,
#                         'style': 'normal',
#                         'level': 0
#                     })
#                     processed_texts.add(text_content)
                    
#             elif element.name == 'ul':
#                 # Process list items directly from ul
#                 for li in element.find_all('li', recursive=False):
#                     li_text = li.get_text().strip()
#                     if li_text not in processed_texts:
#                         # Check if this bullet point contains formatted text
#                         formatted = li.find(['b', 'i', 'u'])
#                         if formatted:
#                             parsed_content.append({
#                                 'text': li_text,
#                                 'style': 'bullet',
#                                 'level': 1,
#                                 'format': formatted.name  # Preserve the formatting
#                             })
#                         else:
#                             parsed_content.append({
#                                 'text': li_text,
#                                 'style': 'bullet',
#                                 'level': 1
#                             })
#                         processed_texts.add(li_text)

#             elif element.name in ['b', 'i', 'u']:
#                 # Only process formatted text that isn't within a bullet point
#                 if not element.find_parent('li') and text_content not in processed_texts:
#                     parsed_content.append({
#                         'text': text_content,
#                         'style': 'formatted',
#                         'format': element.name
#                     })
#                     processed_texts.add(text_content)

#         return parsed_content


#     @staticmethod
#     def add_title(slide, title):
#         left, top, width, height = Inches(0.5), Inches(0.5), Inches(9), Inches(1)
#         txBox = slide.shapes.add_textbox(left, top, width, height)
#         tf = txBox.text_frame
#         tf.word_wrap = True
#         p = tf.add_paragraph()
#         p.text = title
#         p.alignment = PP_ALIGN.CENTER
#         font = p.font
#         font.size = Pt(32)
#         font.color.rgb = RGBColor(0, 51, 102)
#         font.bold = True

#     @staticmethod
#     def add_content(slide, html_content):
#         content = PptGenerator.parse_html_content(html_content)
#         left, top, width, height = Inches(0.5), Inches(1.5), Inches(9), Inches(5)
#         txBox = slide.shapes.add_textbox(left, top, width, height)
#         tf = txBox.text_frame
#         tf.word_wrap = True

#         for item in content:
#             p = tf.add_paragraph()
#             p.alignment = PP_ALIGN.LEFT

#             if item['style'] == 'header':
#                 p.text = item['text']
#                 p.font.size = Pt(24 - (item['level'] * 4))
#                 p.font.bold = True
#                 p.level = item['level'] - 1
#             elif item['style'] == 'bullet':
#                 p.text = "• " + item['text']
#                 p.level = 1
#                 p.font.size = Pt(18)
#                 # Apply any formatting if present in the bullet point
#                 if 'format' in item:
#                     run = p.runs[0]
#                     if item['format'] == 'b':
#                         run.font.bold = True
#                     elif item['format'] == 'i':
#                         run.font.italic = True
#                     elif item['format'] == 'u':
#                         run.font.underline = True
#             else:  # normal text or formatted text
#                 p.text = item['text']
#                 p.font.size = Pt(18)
#                 if item.get('style') == 'formatted':
#                     run = p.runs[0]
#                     if item['format'] == 'b':
#                         run.font.bold = True
#                     elif item['format'] == 'i':
#                         run.font.italic = True
#                     elif item['format'] == 'u':
#                         run.font.underline = True

#             # Check and adjust font size if needed
#             while PptGenerator.check_text_exceeds_bounds(p):
#                 p.font.size -= Pt(1)
#                 if p.font.size < Pt(10):
#                     break

#     @staticmethod
#     def check_text_exceeds_bounds(paragraph):
#         max_characters_per_line = 80
#         max_lines = 10
#         text_length = len(paragraph.text)
#         lines = (text_length // max_characters_per_line) + 1
#         return lines > max_lines
    
#     #-----------------------------------------Images---------------------------------------------
#     @staticmethod
#     def process_image(image_source):
#         """
#         Process image from either base64 string or URL
#         Returns: BytesIO object containing the image
#         """
#         try:
#             if image_source.startswith('data:image'):
#                 # Handle base64 image
#                 base64_data = image_source.split(',')[1]
#                 return BytesIO(base64.b64decode(base64_data))
#             elif image_source.startswith(('http://', 'https://')):
#                 # Handle URL image
#                 response = requests.get(image_source)
#                 response.raise_for_status()
#                 return BytesIO(response.content)
#             else:
#                 raise ValueError("Unsupported image source format")
#         except Exception as e:
#             print(f"Error processing image: {str(e)}")
#             return None

#     @staticmethod
#     def calculate_image_dimensions(image_stream, slide_width, slide_height, max_width_ratio=0.8, max_height_ratio=0.6):
#         """
#         Calculate the dimensions for the image while maintaining aspect ratio
#         Returns: (width, height) in inches
#         """
#         try:
#             # Open image and get original dimensions
#             with Image.open(image_stream) as img:
#                 img_width, img_height = img.size
                
#             # Reset stream position
#             image_stream.seek(0)
            
#             # Calculate available space in pixels (assuming 96 DPI)
#             available_width = slide_width * max_width_ratio
#             available_height = slide_height * max_height_ratio
            
#             # Calculate scaling factors
#             width_ratio = available_width / img_width
#             height_ratio = available_height / img_height
            
#             # Use the smaller ratio to fit within bounds
#             scale = min(width_ratio, height_ratio)
            
#             # Calculate final dimensions in inches (converting from pixels)
#             final_width = (img_width * scale) / 96
#             final_height = (img_height * scale) / 96
            
#             return final_width, final_height
#         except Exception as e:
#             print(f"Error calculating image dimensions: {str(e)}")
#             return None, None

#     @staticmethod
#     def add_image(slide, image_source, position='center'):
#         """
#         Add an image to the slide at the specified position
#         Parameters:
#             slide: PowerPoint slide object
#             image_source: URL or base64 string of the image
#             position: 'center', 'left', 'right', 'top', 'bottom', or tuple of (left, top) in inches
#         """
#         # try:
#             # Get slide dimensions
#         slide_width = 600
#         slide_height = 400
        
#         # Process image
#         image_stream = PptGenerator.process_image(image_source)
#         if not image_stream:
#             return False
            
#         # Calculate dimensions
#         width, height = PptGenerator.calculate_image_dimensions(
#             image_stream, 
#             slide_width / 914400,  # Convert EMU to inches
#             slide_height / 914400
#         )
        
#         if not width or not height:
#             return False
            
#         # Calculate position
#         if position == 'center':
#             left = (slide_width - width * 914400) / 2 / 914400  # Convert to inches
#             top = (slide_height - height * 914400) / 2 / 914400
#         elif position == 'left':
#             left = Inches(1)
#             top = (slide_height - height * 914400) / 2 / 914400
#         elif position == 'right':
#             left = slide_width / 914400 - width - Inches(1)
#             top = (slide_height - height * 914400) / 2 / 914400
#         elif position == 'top':
#             left = (slide_width - width * 914400) / 2 / 914400
#             top = Inches(1)
#         elif position == 'bottom':
#             left = (slide_width - width * 914400) / 2 / 914400
#             top = slide_height / 914400 - height - Inches(1)
#         elif isinstance(position, tuple) and len(position) == 2:
#             left, top = position
#         else:
#             left = (slide_width - width * 914400) / 2 / 914400
#             top = (slide_height - height * 914400) / 2 / 914400

#         # Add image to slide
#         slide.shapes.add_picture(
#             image_stream,
#             Inches(left),
#             Inches(top),
#             Inches(width),
#             Inches(height)
#         )
#         return True
        
#         # except Exception as e:
#         # print(f"Error adding image to slide: {str(e)}")
#         # return False

#     @staticmethod
#     def distribute_images_to_slides(total_slides: int, images: list) -> dict:
#         """
#         Distribute images randomly to slides ensuring at least 2 slides get images
#         Returns: Dictionary mapping slide indices to images
#         """
#         if not images or total_slides < 2:
#             return {}
            
#         # Determine number of slides that will get images
#         min_slides_with_images = min(2, total_slides)  # At least 2 slides or all if less than 2
#         max_slides_with_images = min(total_slides, len(images))  # Can't add more images than we have
        
#         # Randomly choose how many slides will get images
#         num_slides_with_images = random.randint(min_slides_with_images, max_slides_with_images)
        
#         # Randomly select which slides will get images
#         selected_slide_indices = random.sample(range(total_slides), num_slides_with_images)
        
#         # Randomly select images from the available ones
#         selected_images = random.sample(images, num_slides_with_images)
        
#         # Create mapping of slide index to image
#         return dict(zip(selected_slide_indices, selected_images))

#     @staticmethod
#     def create_presentation(slide_data_list: list[dict], course_name, lesson_name, markdown_images_list: list[list]):
#         prs = Presentation()
#         blank_slide_layout = prs.slide_layouts[6]
#         current_dir = os.path.dirname(__file__)
#         downloads_directory = os.path.join(current_dir, 'presentations', course_name)
#         os.makedirs(downloads_directory, exist_ok=True)
#         downloads_path = os.path.join(downloads_directory, lesson_name)
        
#         # Flatten the list of lists into a single list of images
#         all_images = [img for sublist in markdown_images_list for img in sublist if img]
        
#         # Get the image distribution mapping
#         total_slides = len(slide_data_list)
#         slide_image_mapping = PptGenerator.distribute_images_to_slides(total_slides, all_images)
        
#         # Create slides
#         for index, slide_data in enumerate(slide_data_list):
#             slide = prs.slides.add_slide(blank_slide_layout)
            
#             # Add title and content
#             PptGenerator.add_title(slide, slide_data.get('title', 'Untitled'))
#             PptGenerator.add_content(slide, slide_data.get('slide_content', ''))
            
#             # Add image if this slide was selected for an image
#             if index in slide_image_mapping:
#                 image_source = slide_image_mapping[index]
#                 # Randomly choose position (left or right to avoid content overlap)
#                 position = random.choice(['left', 'right'])
#                 PptGenerator.add_image(slide, image_source, position)

#         prs.save(downloads_path)
#         print(f"Presentation saved as {downloads_path}")
#         return downloads_path
    
    
    
    
    
    
    
#     def generate_ppt_content(self, markdown_list : list[dict]):
#         prompt = """You are a skilled and creative expert in designing PowerPoint presentations. Your task is to take the content of a course and craft an engaging and concise presentation which is content-rich.\nFor each topic in the course, you will design slides explaining the topics provided. For each topic in the course, consolidate information into fewer slides (10-15 slides) by grouping related subtopics or concepts. Aim to minimize the total number of slides while ensuring each slide contains detailed and comprehensive content that thoroughly explains the topic. Strive for a balance between clarity and depth, presenting all critical information within a logical structure. \nEnsure that the slides are:\n - Organized logically for easy understanding.\n - Engaging and aligned with professional presentation standards.\n\n # Course Content:\n\n"""
#         for index, markdown in enumerate(markdown_list):
#             for key, value in markdown.items():
#                 prompt += f"## Topic {index + 1}: {key}\n## Content {index +1}: {value}\n\n"

#         output_format_prompt = """-------------------\n# OUTPUT FORMAT INSTRUCTIONS:\nThe output should be a list of dictionaries where each dictionary represents the content of one slide. Each dictionary within the list must include two keys:\n'title': The title of the slide, summarizing the main point of the topic.\n'slide_content': Detailed and comprehensive content to include on the slide, formatted as HTML. This should contain:\n - Paragraphs with detailed explanations, covering all relevant information.\n - Bullet points that expand on key details, ensuring clarity and depth.\n - Do not include any heading tags in the slide_content.\nProvide the output strictly as a list of dictionaries following the format as described. Do not include unnecessary text like ```json in the output. It should strictly only be a list of dictionary."""
#         prompt += output_format_prompt
#         while True:
#             try:
#                 output = self.gemini_client.generate_response(prompt, remove_literals=False)
#                 pattern = r"\[\s*(.*)\s*\]"
#                 match = re.search(pattern, output, re.DOTALL)
#                 extracted_list_string = match.group(0)
#                 extracted_list = ast.literal_eval(extracted_list_string)
#                 return extracted_list
#             except Exception as e:
#                 print(f"Exception while creating PPT:{e}.\nTrying again in 10 seconds...")
#                 time.sleep(10)
