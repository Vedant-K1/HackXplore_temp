import os
from PIL import Image
import fitz
import base64
import io
import torch
import asyncio
import httpx
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urlparse
import re

class DocumentUtils:

    @staticmethod
    async def extract_images_from_pdf(pdf_document, pdf_output_directory):
        def extract_images():
            for page_index in range(len(pdf_document)):
                page = pdf_document.load_page(page_index)
                image_list = page.get_images(full=True)

                for image_index, img in enumerate(image_list, start=1):
                    xref = img[0]
                    base_image = pdf_document.extract_image(xref)
                    image_ext = base_image["ext"]
                    image_bytes = base_image["image"]
                    image_path = f"{pdf_output_directory}/image_{page_index + 1}_{image_index}.{image_ext}"
                    image = Image.open(io.BytesIO(image_bytes))
                    image.save(image_path)
        await asyncio.to_thread(extract_images)


    @staticmethod
    async def extract_images_from_directory(documents_directory, output_directory_path):
        print("\nExtracting images from documents...\n")
        if not os.path.exists(output_directory_path):
            os.makedirs(output_directory_path)

        extract_task = []
        for filename in os.listdir(documents_directory):
            file_path = os.path.join(documents_directory, filename)
            
            if filename.endswith(".pdf"):
                pdf_document = fitz.open(file_path)
        
                pdf_output_directory = os.path.join(output_directory_path, os.path.splitext(os.path.basename(file_path))[0])
                if not os.path.exists(pdf_output_directory):
                    os.makedirs(pdf_output_directory)
                extract_task.append(DocumentUtils.extract_images_from_pdf(pdf_document, pdf_output_directory))
            else:
                raise Exception("Only PDF format is supported.")
        await asyncio.gather(*extract_task)
        print(f"Images extracted from all documents in {documents_directory} and saved to {output_directory_path}")

    @staticmethod
    def embed_image_with_clip(image_path, clip_model, clip_processor, device_type="cpu"):
        image = Image.open(image_path)
        inputs = clip_processor(images=image, return_tensors="pt").to(device_type)
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
        image_features_normalized = image_features / image_features.norm(dim=-1, keepdim=True)
        image_features_normalized = image_features_normalized.cpu().numpy()
        return image_features_normalized

    @staticmethod
    def embed_text_with_clip(text, clip_model, clip_tokenizer, device_type="cpu"):
        inputs = clip_tokenizer([text], return_tensors="pt").to(device_type)
        with torch.no_grad():
            text_features = clip_model.get_text_features(**inputs)
        text_features_normalized = text_features / text_features.norm(dim=-1, keepdim=True)
        text_features_normalized = text_features_normalized.cpu().numpy()
        return text_features_normalized
    
    @staticmethod
    def image_to_base64(image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
        
class WebUtils:
    @staticmethod
    def sanitize_filename(url):
        parsed_url = urlparse(url)
        path = parsed_url.path
        
        sanitized_filename = re.sub(r'[<>:"/\\|?*]', '_', Path(path).name)
        return sanitized_filename

    @staticmethod
    async def download_image(url, filepath, client):
        try:
            response = await client.get(url)
            response.raise_for_status()
            filepath.write_bytes(response.content)
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            print(f"Error downloading image from {url}: {e}")

    @staticmethod
    async def scrape_images(url, client, download_dir):
        try:
            response = await client.get(url)
            response.raise_for_status()
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            print(f"Error fetching page {url}: {e}")
            return
        soup = BeautifulSoup(response.text, "html.parser")
        download_tasks = []
        for img_tag in soup.find_all("img"):
            img_url = img_tag.get("src")
            if img_url:
                try:
                    img_url = response.url.join(img_url)
                    valid_img_url = httpx.URL(img_url)
                    
                    # Sanitize the filename to remove invalid characters
                    sanitized_filename = WebUtils.sanitize_filename(str(valid_img_url))
                    img_filename = download_dir / sanitized_filename

                    download_tasks.append(
                        WebUtils.download_image(valid_img_url, img_filename, client)
                    )
                except (httpx.InvalidURL, ValueError):
                    print(f"Invalid image URL: {img_url}. Skipping.")
        await asyncio.gather(*download_tasks)

    @staticmethod
    async def extract_images_from_webpages(urls, output_directory_path):
        download_dir = Path(output_directory_path)
        download_dir.mkdir(parents=True, exist_ok=True)
        print("\nExtracting images from Webpages...\n")
        async with httpx.AsyncClient() as client:
            scrape_tasks = []
            for url in urls:
                try:
                    valid_url = httpx.URL(url)
                except (httpx.InvalidURL, ValueError):
                    print(f"Invalid URL: {url}. Skipping.")
                    continue

                url_download_dir = download_dir / Path(valid_url.host)
                url_download_dir.mkdir(parents=True, exist_ok=True)
                scrape_tasks.append(WebUtils.scrape_images(valid_url, client, url_download_dir))
            await asyncio.gather(*scrape_tasks)
        print("\nExtracted images from web pages successfully!\n")