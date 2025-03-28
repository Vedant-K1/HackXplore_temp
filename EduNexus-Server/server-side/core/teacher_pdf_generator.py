import os
import re
import base64
import urllib.request
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm

class MarkdownPdfGenerator:
    def __init__(self):
        self.heading_font_name = 'DejaVuSansCondensed'
        self.normal_font_name = 'DejaVuSansCondensed'
        self.current_dir = os.path.dirname(__file__)
        self.dejavu_sans_path = os.path.join(self.current_dir, 'fonts', 'DejaVuSansCondensed.ttf')
        # Removed logo image as per requirements.
        # self.logo_path = os.path.join(self.current_dir, 'logo', 'logo.png')

        # Register fonts
        pdfmetrics.registerFont(TTFont(self.heading_font_name, self.dejavu_sans_path))
        pdfmetrics.registerFont(TTFont(self.normal_font_name, self.dejavu_sans_path))

        # Get sample styles and update them
        self.styles = getSampleStyleSheet()
        self.styles['Heading1'].fontName = self.heading_font_name
        self.styles['Heading1'].fontSize = 16
        self.styles['Heading1'].spaceAfter = 12

        self.styles['Heading2'].fontName = self.heading_font_name
        self.styles['Heading2'].fontSize = 14
        self.styles['Heading2'].spaceAfter = 10

        self.styles['Normal'].fontName = self.normal_font_name
        self.styles['Normal'].fontSize = 10
        self.styles['Normal'].spaceAfter = 8

        # Add Heading3 style if not present
        if 'Heading3' not in self.styles:
            self.styles.add(ParagraphStyle(name='Heading3', fontName=self.heading_font_name, fontSize=12, spaceAfter=8))
        # Add URL style if not present
        if 'URL' not in self.styles:
            self.styles.add(ParagraphStyle(name='URL', textColor=colors.blue, underline=True, spaceAfter=8))

    def add_page_number(self, canvas, doc):
        page_num = canvas.getPageNumber()
        text = "Page %d" % page_num
        canvas.drawRightString(200 * mm, 20 * mm, text)

    def markdown_to_flowables(self, markdown_text, image_list=None):
        """
        Process markdown text line-by-line and convert to ReportLab flowables.
        Supports image markdown of the form ![image-<submoduleIndex>-<imageIndex>].
        The image_list parameter should be a list of lists. Each image value can be either:
          - a base64 data URL (starting with "data:image") or 
          - an HTTP URL (or a file path).
        """
        flowables = []
        lines = markdown_text.split('\n')
        image_pattern = r'!\[(.*?)\]'

        for idx, line in enumerate(lines):
            # Look for image markdown in the line.
            image_match = re.search(image_pattern, line)
            if image_match:
                identifier = image_match.group(1)
                # Expecting a pattern like "image-0-0"
                m = re.match(r'image-(\d+)-(\d+)', identifier)
                if m and image_list:
                    submoduleIndex = int(m.group(1))
                    imageIndex = int(m.group(2))
                    image_value = None
                    try:
                        image_value = image_list[submoduleIndex][imageIndex]
                    except (IndexError, TypeError):
                        image_value = None
                    if image_value:
                        # Check if image_value is base64 or a URL/file path.
                        if image_value.startswith("data:image"):
                            try:
                                header, base64_data = image_value.split(',', 1)
                                image_data = base64.b64decode(base64_data)
                                image_file = BytesIO(image_data)
                                flowables.append(Image(image_file, width=300, height=200))
                            except Exception as e:
                                # If decoding fails, skip the image.
                                pass
                        elif image_value.startswith("http"):
                            try:
                                with urllib.request.urlopen(image_value) as u:
                                    image_data = u.read()
                                image_file = BytesIO(image_data)
                                flowables.append(Image(image_file, width=300, height=200))
                            except Exception as e:
                                # If downloading fails, skip the image.
                                pass
                        else:
                            # Assume it's a local file path.
                            try:
                                flowables.append(Image(image_value, width=300, height=200))
                            except Exception as e:
                                pass
                        continue  # Skip further processing of this line

            # Process headings and formatting similar to your React logic.
            if line.startswith('## '):
                text = line[3:]
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                flowables.append(Paragraph(text, self.styles['Heading2']))
            elif line.startswith('# '):
                text = line[2:]
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                flowables.append(Paragraph(text, self.styles['Heading1']))
            elif line.startswith('### '):
                text = line[4:]
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                flowables.append(Paragraph(text, self.styles['Heading3']))
            elif line.startswith('* ') or line.startswith('- '):
                # Process bullet list items.
                text = line[2:]
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                bullet_text = '• ' + text
                flowables.append(Paragraph(bullet_text, self.styles['Normal']))
            else:
                # Process normal text with bold formatting.
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
                if text.strip() == '':
                    flowables.append(Spacer(1, 12))
                else:
                    flowables.append(Paragraph(text, self.styles['Normal']))

        return flowables

    def generate_pdf(self, pdf_file_path, course_title, submodules, image_list=None):
        """
        Generate a PDF document.
        
        pdf_file_path: Path to save the generated PDF.
        course_title: Title of the course to display at the top.
        submodules: A list of dictionaries. Each dictionary should have one key-value pair:
                    { submodule_title: markdown_text }
        image_list: A list of lists of images referenced in the markdown.
                    Each image can be a base64 data URL or an HTTP URL.
                    
        Every module will start on a new page.
        """
        pdf = SimpleDocTemplate(pdf_file_path, pagesize=letter)
        content = [
            Paragraph("Disclaimer: This content is generated by EduNexus an AI Application.", self.styles['Heading2']),
            Paragraph(course_title, self.styles['Heading1']),
            Spacer(1, 12)
        ]
        
        first = True
        for module in submodules:
            if not first:
                content.append(PageBreak())
            first = False
            for submodule_title, markdown_text in module.items():
                # content.append(Paragraph(submodule_title, self.styles['Heading2']))
                content.extend(self.markdown_to_flowables(markdown_text, image_list))
                content.append(Spacer(1, 12))
        
        pdf.build(content, onFirstPage=self.add_page_number, onLaterPages=self.add_page_number)
