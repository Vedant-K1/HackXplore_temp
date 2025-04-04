from reportlab.lib.pagesizes import letter
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm
import os


class PdfGenerator:
    def __init__(self):
        self.heading_font_name = 'DejaVuSansCondensed'
        self.dev_heading_font_name = 'NotoSansDevanagari'
        self.normal_font_name = 'DejaVuSansCondensed'
        self.current_dir = os.path.dirname(__file__)
        self.noto_sans_path = os.path.join(self.current_dir, 'fonts', 'NotoSansDevanagari-Regular.ttf')
        self.dejavu_sans_path = os.path.join(self.current_dir, 'fonts', 'DejaVuSansCondensed.ttf')
        self.logo_path = os.path.join(self.current_dir, 'logo', 'logo.png')

    def add_page_number(self, canvas, docs):
        # Add page numbers
        page_num = canvas.getPageNumber()
        text = "Page %d" % page_num
        canvas.drawRightString(200*mm, 20*mm, text)
        
    def generate_pdf(self, pdf_file_path, modulename, module_summary, submodule_content, src_lang, video_urls):
        # Register Unicode fonts
        pdfmetrics.registerFont(TTFont('NotoSansDevanagari', self.noto_sans_path))
        pdfmetrics.registerFont(TTFont('DejaVuSansCondensed', self.dejavu_sans_path))

        # Create a PDF document
        pdf = SimpleDocTemplate(pdf_file_path, pagesize=letter)

        # Define styles for different headings and content
        styles = {
            'Heading1': ParagraphStyle(name='Heading1', fontName=self.heading_font_name , fontSize=16, spaceAfter=16, spaceBefore=16, bold=True),
            'Heading2': ParagraphStyle(name='Heading2', fontName=self.heading_font_name , fontSize=14, spaceAfter=14, spaceBefore=14),
            'Heading3': ParagraphStyle(name='Heading3', fontName=self.heading_font_name , fontSize=12, spaceAfter=12, spaceBefore=12),
            'Devanagari_Heading1': ParagraphStyle(name='Devanagari_Heading1', fontName=self.dev_heading_font_name, fontSize=16, spaceAfter=16, spaceBefore=16, bold=True),
            'Devanagari_Heading2': ParagraphStyle(name='Devanagari_Heading2', fontName=self.dev_heading_font_name, fontSize=14, spaceAfter=14, spaceBefore=14, bold=True),
            'Devanagari_Heading3': ParagraphStyle(name='Devanagari_Heading3', fontName=self.dev_heading_font_name, fontSize=12, spaceAfter=12, spaceBefore=12, bold=True),
            'Normal': ParagraphStyle(name='Normal', fontName=self.normal_font_name, fontSize=8, spaceAfter=8, spaceBefore=8),
            'URL': ParagraphStyle(name='URL', textColor=colors.blue, underline=True, spaceAfter=8),
        }

        # Build the PDF document
        content = [
            Image(self.logo_path, width=440, height=237),
            Paragraph("Disclaimer: This content is generated by AI.", styles['Heading3']),
            Paragraph(modulename, styles['Heading1' if src_lang == 'english' else 'Devanagari_Heading1']),
            Paragraph("Module Summary:", styles['Heading2' if src_lang == 'english' else 'Devanagari_Heading2']),
            Paragraph(module_summary, styles['Heading3' if src_lang == 'english' else 'Devanagari_Heading3']),
        ]

        # Add submodule content
        for i, entry in enumerate(submodule_content):
            content.append(Paragraph(entry['subject_name'], styles['Heading2' if src_lang == 'english' else 'Devanagari_Heading2']))
            content.append(Paragraph(entry['content'], styles['Heading3' if src_lang == 'english' else 'Devanagari_Heading3']))

            # Check if there are subsections
            if 'subsections' in entry:
                for subsection in entry['subsections']:
                    content.append(Paragraph(subsection['title'], styles['Heading2' if src_lang == 'english' else 'Devanagari_Heading2']))
                    content.append(Paragraph(subsection['content'], styles['Heading3' if src_lang == 'english' else 'Devanagari_Heading3']))
            
            # Check if there are URLs
            if 'urls' in entry:
                content.append(Paragraph("Reference:", styles['Heading3']))
                for url in entry['urls']:
                    content.append(Paragraph(url, styles['URL']))

            if video_urls[i]:
                content.append(Paragraph("Video Links:", styles['Heading3']))
                for url in video_urls[i]:
                    content.append(Paragraph(url, styles['URL']))

        pdf.build(content, onFirstPage=self.add_page_number, onLaterPages=self.add_page_number)