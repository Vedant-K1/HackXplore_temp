import pandas as pd
import json
from google import genai
from datetime import datetime
import os

from dotenv import load_dotenv
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_timetable(teachers_subjects, classes_subjects, hours_per_week, preferred_slots, classrooms,labs, lab_requirements,theory_requirements, start_time, end_time):
    

    print("request sent")
    prompt = f"""
        Act like an expert academic scheduler and timetable generator. 
        You specialize in efficiently organizing timetables for schools and colleges while ensuring there are no scheduling conflicts for teachers, classrooms, or students. Your goal is to create a well-structured timetable in JSON format based on the given constraints.

        ### **Input Details:**  
        You will receive the following information:

        1. **Teachers and Subjects**  
        - A list of teachers with the subjects they teach.  
        - The classes each teacher is assigned to.  
        - The total number of hours per week each teacher needs to teach each subject.  
        
        teachers_subjects = {teachers_subjects}  
        hours_per_week = {hours_per_week}  
        classes_subjects = {classes_subjects}   (Which class have which subjects)

        2. **Preferred Time Slots**  
        - The preferred days and hours for each teacher.  
        - Any unavailable slots for specific teachers.  

        preferred_slots = {preferred_slots}  

        3. **Classrooms, Labs, and Class Subjects**  
        - The total number of classrooms and labs available.  
        - A dictionary specifying which classes have which subjects.  
        - A list of available lab rooms.  
        - A list of subjects that require only theory lectures.  
        - A dictionary mapping lab-required subjects to their designated labs.  

        classrooms = {classrooms}  
        labs = {labs}  
        theory subjects are = {theory_requirements}  
        Lab subjects are = {lab_requirements}  


        4. **College Timings**  
        - The start and end times of the academic day.  
        - Each lecture lasts **1 hour**, while lab sessions last **2 consecutive hours**.
        - The number of slots per day should be dynamically calculated based on these timings.

        start_time = {start_time}  # Integer (e.g., 9 for 9:00 AM)
        end_time = {end_time}  # Integer (e.g., 17 for 5:00 PM)

        Constraints to Follow:
        1. No teacher should have overlapping lectures.
        2. No class should have overlapping subjects at the same time.
        3. A classroom or lab should not be double-booked.
        4. Ensure that all teaching hours per week are met for each subject.
        5. Prioritize teacher preferences when possible.
        6. Subjects in `theory_requirements` should be scheduled only in regular classrooms, not labs.
        7. Subjects listed in `lab_requirements` must be scheduled in their designated lab and should take **2 consecutive slots**.

        ### **Output Format:**  
        The timetable should be structured in JSON format as follows:

        - The keys for teachers and classes should include the day and an identifier (e.g., "monday_Mrs Johnson" or "monday_10A").
        - The number of slots per day is dynamic based on the college timings (each slot is 1 hour; labs occupy 2 consecutive slots).
        - For teachers, each time slot entry should be either an empty list or a list of three elements: [Classroom/Lab, Class, Subject].
        - For classes, each time slot entry should be either an empty list or a list of three elements: [Classroom/Lab, Teacher, Subject].

        Example JSON structure:
        ```json
        {{
            "teachers": {{
                "monday_Mrs Johnson": [[], ["CR1", "10A", "Maths"], [], ...],
                "tuesday_Mrs Johnson": [[], [], ["CR2", "10A", "Maths"], ...],
                ...,
                "Saturday_Mr Smith": [["CR1", "10D", "Science"], ["CR1", "10B", "Science"], ...]
            }},
            "Classes": {{
                "monday_10A": [[], ["CR1", "Mrs Johnson", "Maths"], ...],
                "tuesday_10A": [[], [], ["CR2", "Mrs Johnson", "Maths"], ...],
                ...,
                "Saturday_10D": [["102", "Mr Smith", "Science"], ...]
            }}
        }}
        ```
        Each list in the timetable corresponds to a 1-hour slot; if a lab is scheduled, it should cover 2 consecutive slots.

        Analyze the input constraints and generate an optimized timetable that follows the above rules. If a perfect schedule isn't possible, provide the best possible solution and highlight any conflicts.

        Take a deep breath and work on this problem step-by-step.
    """


    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
        },
    )

    # print(response.text)
    return response.text


def save_timetable_to_excel(timetable, start_time="8:30", end_time="17:30"):
    output_folder = "/timetables_output"

    # Create the folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Generate a unique file name with a timestamp
    unique_name = f"timetable_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    file_path = os.path.join(output_folder, unique_name)
    print("Saving timetable to:", file_path)
    writer = pd.ExcelWriter(file_path, engine='xlsxwriter')
    workbook = writer.book
    
    # Define cell formats
    cell_format = workbook.add_format({
        'border': 1, 
        'align': 'center', 
        'valign': 'vcenter', 
        'text_wrap': True
    })
    header_format = workbook.add_format({
        'bold': True, 
        'border': 1, 
        'align': 'center', 
        'valign': 'vcenter', 
        'bg_color': '#D7E4BC'
    })
    
    # Order of days to display in the table
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    #############################
    # Process Teachers Timetable
    #############################
    teachers_data = timetable.get("teachers", {})
    # Group by teacher name from keys like "monday_Mr. Smith"
    teachers_grouped = {}
    for key, slots in teachers_data.items():
        parts = key.split("_", 1)
        if len(parts) != 2:
            continue
        day = parts[0].capitalize()   # e.g., "Monday"
        teacher = parts[1]
        if teacher not in teachers_grouped:
            teachers_grouped[teacher] = {}
        teachers_grouped[teacher][day] = slots  # each slots is a list (e.g. 6 slots)
    
    for teacher, day_slots in teachers_grouped.items():
        # Determine the number of slots (assume all days have the same number or use the max)
        # Calculate the number of slots dynamically based on start_time and end_time
        time_format = "%H:%M"  # Adjust if using a different format
        start_dt = datetime.strptime(start_time, time_format)
        end_dt = datetime.strptime(end_time, time_format)
        num_slots = int((end_dt - start_dt).total_seconds() // 3600)  # Each slot = 1 hour

        if num_slots == 0:
            continue

        # Generate time slot boundaries and then time slot ranges as column headers.
        boundaries = pd.date_range(start=start_time, end=end_time, periods=num_slots+1)
        time_slots = [
            f"{boundaries[i].strftime('%I:%M %p')} - {boundaries[i+1].strftime('%I:%M %p')}"
            for i in range(num_slots)
        ]
        
        # Build a dictionary: keys = Day, value = list of cell contents for each time slot
        table_data = {}
        for day in days_order:
            slots = day_slots.get(day, [""] * num_slots)
            row = []
            for slot in slots:
                # For teachers, each slot is expected to be [Location, Class, Subject]
                if isinstance(slot, list) and slot:
                    row.append(", ".join(map(str, slot)))
                else:
                    row.append("")
            table_data[day] = row
        
        # Ensure the number of time slot headers matches the number of columns in table_data
        max_columns = max(len(row) for row in table_data.values())
        if len(time_slots) > max_columns:
            time_slots = time_slots[:max_columns]
        elif len(time_slots) < max_columns:
            time_slots.extend([f"Slot {i+1}" for i in range(len(time_slots), max_columns)])

        # Create DataFrame: rows = days, columns = computed time slots
        df = pd.DataFrame.from_dict(table_data, orient="index", columns=time_slots)
        df.index.name = "Day"
        
        # Use the teacher's name (truncated to 31 characters) as the sheet name
        sheet_name = teacher[:31]
        df.to_excel(writer, sheet_name=sheet_name)
        worksheet = writer.sheets[sheet_name]
        
        # Format header row (time slot columns)
        for col_num, col_name in enumerate(df.columns):
            worksheet.write(0, col_num + 1, col_name, header_format)
            worksheet.set_column(col_num + 1, col_num + 1, 25)
        
        # Write day names in the first column
        for row_num, day in enumerate(df.index):
            worksheet.write(row_num + 1, 0, day, header_format)
        
        # Write cell data with formatting
        for i in range(df.shape[0]):
            for j in range(df.shape[1]):
                worksheet.write(i + 1, j + 1, df.iloc[i, j], cell_format)
                
    #############################
    # Process Classes Timetable
    #############################
    classes_data = timetable.get("Classes", {})
    classes_grouped = {}
    for key, slots in classes_data.items():
        parts = key.split("_", 1)
        if len(parts) != 2:
            continue
        day = parts[0].capitalize()
        class_name = parts[1]
        if class_name not in classes_grouped:
            classes_grouped[class_name] = {}
        classes_grouped[class_name][day] = slots  # each slot is expected to be [Classroom, Teacher, Subject]
    
    for class_name, day_slots in classes_grouped.items():
        time_format = "%H:%M"
        start_dt = datetime.strptime(start_time, time_format)
        end_dt = datetime.strptime(end_time, time_format)
        num_slots = int((end_dt - start_dt).total_seconds() // 3600)
        
        if num_slots == 0:
            continue
        
        boundaries = pd.date_range(start=start_time, end=end_time, periods=num_slots+1)
        time_slots = [
            f"{boundaries[i].strftime('%I:%M %p')} - {boundaries[i+1].strftime('%I:%M %p')}"
            for i in range(num_slots)
        ]
        
        table_data = {}
        for day in days_order:
            slots = day_slots.get(day, [""] * num_slots)
            row = []
            for slot in slots:
                # Ensure the slot has at least 3 elements: [Classroom, Teacher, Subject]
                print(slot)
                if isinstance(slot, list) and len(slot) == 3:
                    classroom, teacher, subject = slot
                    row.append(f"{classroom}\n{teacher}\n{subject}")  # Each on a new line
                elif isinstance(slot, list) and len(slot) > 0:
                    row.append("\n".join(map(str, slot)))  # Join what exists
                else:
                    row.append("")

            table_data[day] = row
        
        # Ensure the number of time slot headers matches the number of columns in table_data
        max_columns = max(len(row) for row in table_data.values())
        if len(time_slots) > max_columns:
            time_slots = time_slots[:max_columns]
        elif len(time_slots) < max_columns:
            time_slots.extend([f"Slot {i+1}" for i in range(len(time_slots), max_columns)])

        
        df = pd.DataFrame.from_dict(table_data, orient="index", columns=time_slots)
        df.index.name = "Day"
        
        sheet_name = class_name[:31]
        df.to_excel(writer, sheet_name=sheet_name)
        worksheet = writer.sheets[sheet_name]
        
        # Format header row (time slot columns)
        for col_num, col_name in enumerate(df.columns):
            worksheet.write(0, col_num + 1, col_name, header_format)
            worksheet.set_column(col_num + 1, col_num + 1, 25)
        
        # Write day names in first column
        for row_num, day in enumerate(df.index):
            worksheet.write(row_num + 1, 0, day, header_format)
        
        # Write cell data with formatting
        for i in range(df.shape[0]):
            for j in range(df.shape[1]):
                worksheet.write(i + 1, j + 1, df.iloc[i, j], cell_format)
    
    writer.close()
    return file_path

import pathlib
from google.genai import types



def ass_eval(subject_name, details_from_teacher, doc):
    prompt=f"""
    You will be given a document containing responses to an assignment. Your task is to evaluate the answers. Each question is of 5 marks(Unless specified by the teacher), assign the marks for each question based on the following criteria:

    1. **Accuracy & Relevance:** Does the answer correctly address the question?
    2. **Depth & Understanding:** Does the answer demonstrate a clear grasp of the topic?
    3. **Clarity & Coherence:** Is the response well-structured and easy to understand?
    4. **Grammar & Presentation:** Are there any spelling, grammatical, or formatting errors?
    5. **Handwriting:** Is the handwriting legible? (If the document is not handwritten, this criterion does not apply.)

    For any marks deducted, provide a detailed, point-by-point explanation outlining why the marks were cut.

     
    The name of the subject is: {subject_name}
    additional details from the teacher: {details_from_teacher}
    
    **Output Format:**
    Return your evaluation in the following JSON format:
    Example JSON Format
    {{
        "marks":[4,3,5,5,2.....],
        "Justification: ["1. Deducted 1 mark for ...",
        "2. Deducted 2 marks because the answer only partially addressed the question and lacked depth.",
        "3. Full marks as the response is accurate and well explained.",
        "4. Deducted 1 mark for ...",
        "5. Deducted 2 marks due to illegible handwriting affecting clarity."]
        "total_marks": 20,        
    }}
    """
    filepath = pathlib.Path(doc)
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            prompt,
            types.Part.from_bytes(
                data=filepath.read_bytes(),
                mime_type='application/pdf',
                )
            ],
        config={
            'response_mime_type': 'application/json',
        },
    )
    print("response", response.text)
    return response.text


# Function to save the evaluation (PDF + details) to MongoDB
def save_evaluation_to_mongo(pdf_file_path, evaluation_details, evaluations_collection):
    """
    Saves a PDF file and its evaluation details in the 'evaluations' collection.
    
    Parameters:
      pdf_file_path (str): Local path to the PDF file.
      evaluation_details (dict): Dictionary with evaluation details.
    
    Returns:
      inserted_id: The ID of the inserted MongoDB document.
    """
    with open(pdf_file_path, "rb") as f:
        pdf_data = f.read()
    
    document = {
        "pdf": pdf_data,  # Store PDF data as binary
        "evaluation_details": evaluation_details,
        "created_at": datetime.utcnow()
    }
    
    result = evaluations_collection.insert_one(document)
    return result.inserted_id




from serpapi import GoogleSearch


def GoogleScholarSearch(q: str):
    params = {
        "engine": "google_scholar",
        "q": q,
        "api_key": os.getenv("SERP_API_KEY")
    }
    search = GoogleSearch(params)
    results = search.get_dict()
    # organic_results = results["organic_results"]
    print("RETURN FROM TOOL=========================",results)
    return results

def generate_response(prompt):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
        )
    )
    return response.text





#===========================New RP ========================

import requests
from typing import List, Dict, Any, Optional
import json
import time



def get_paper_details(paper_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information for a specific paper by ID
    
    Args:
        paper_id: Semantic Scholar Paper ID
        
    Returns:
        Dict containing paper details or None if not found
    """
    try:
        # Semantic Scholar API endpoint for paper details
        api_url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}"
        
        # Fields to retrieve
        fields = "title,abstract,authors,year,url,venue,citationCount"
        
        # Parameters for the API request
        params = {
            "fields": fields
        }
        
        # Add headers including API key if you have one
        headers = {
            "Accept": "application/json"
        }
        
        # Add API key if available
        api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if api_key:
            headers["x-api-key"] = api_key
        
        # Make the API request
        response = requests.get(api_url, params=params, headers=headers)
        response.raise_for_status()
        
        # Parse the response
        paper_details = response.json()
        
        return paper_details
        
    except Exception as e:
        print(f"Error getting paper details: {str(e)}")
        return None
    
    
def search_papers(query: str, limit: int = 5, days_back: int = 365) -> List[Dict[str, Any]]:
    """
    Search for papers using Semantic Scholar API with retry logic
    """
    try:
        # Semantic Scholar API endpoint
        api_url = "https://api.semanticscholar.org/graph/v1/paper/search"
        
        # Parameters for the API request
        params = {
            "query": query,
            "limit": limit,
            "fields": "title,authors,year,abstract,url,venue,citationCount,paperId"
        }
        
        # Add headers including API key if you have one
        headers = {
            "Accept": "application/json"
        }
        
        # Add API key if available
        api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if api_key:
            headers["x-api-key"] = api_key
        
        # Retry logic with exponential backoff
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                # Make the API request
                response = requests.get(api_url, params=params, headers=headers)
                response.raise_for_status()
                
                # Parse the response
                data = response.json()
                
                # Return the paper data
                return data.get("data", [])
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # Rate limit error
                    if attempt < max_retries - 1:  # Not the last attempt
                        print(f"Rate limit hit, retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        raise  # Re-raise on last attempt
                else:
                    raise  # Re-raise other HTTP errors
        
    except Exception as e:
        print(f"Error searching papers: {str(e)}")
        return []

def search_and_summarize_papers(query: str, max_papers: int = 5, days_back: int = 365) -> Dict[str, Any]:
    """
    Search for papers related to a query and generate technical summaries
    
    Args:
        query: The research topic to search for
        max_papers: Maximum number of papers to return (default: 5)
        days_back: How many days back to search (default: 365)
        
    Returns:
        Dict containing the query, timestamp, and list of paper summaries
    """
    try:
        # Step 1: Search for papers using Semantic Scholar API
        papers = search_papers(query, max_papers, days_back)
        
        if not papers:
            return {
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "success": False,
                "message": "No papers found for the given query",
                "papers": []
            }
        
        # Step 2: Get detailed information for each paper
        paper_details = []
        for paper in papers:
            # Get full paper details with abstract
            details = get_paper_details(paper.get("paperId"))
            if details:
                paper_details.append(details)
                
            # Respect API rate limits
            time.sleep(1)
        
        # Step 3: Generate technical summaries using LLM
        summarized_papers = []
        for paper in paper_details:
            if paper.get("abstract"):
                summary = generate_technical_summary(
                    title=paper.get("title", ""),
                    abstract=paper.get("abstract", ""),
                    authors=paper.get("authors", []),
                    year=paper.get("year")
                )
                
                summarized_papers.append({
                    "title": paper.get("title"),
                    "authors": [author.get("name") for author in paper.get("authors", [])],
                    "year": paper.get("year"),
                    "url": paper.get("url"),
                    "abstract": paper.get("abstract"),
                    "summary": summary,
                    "citations": paper.get("citationCount"),
                    "venue": paper.get("venue")
                })
        
        return {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "count": len(summarized_papers),
            "papers": summarized_papers
        }
        
    except Exception as e:
        print(f"Error in search_and_summarize_papers: {str(e)}")
        return {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "message": f"Error processing request: {str(e)}",
            "papers": []
        }
        
        
def generate_technical_summary(title: str, abstract: str, authors: List[Dict[str, str]], year: Optional[int]) -> str:
    """
    Generate a technical summary of a paper using GPT
    
    Args:
        title: Paper title
        abstract: Paper abstract
        authors: List of paper authors
        year: Publication year
        
    Returns:
        Technical summary of the paper
    """
    try:
        # Format the author names
        author_names = [author.get("name", "") for author in authors]
        authors_text = ", ".join(author_names)
        
        # Create the prompt for GPT
        prompt = f"""
        You are a research assistant specializing in creating technical summaries of academic papers.
        Generate a concise technical summary of the following research paper:
        
        Title: {title}
        Authors: {authors_text}
        Year: {year if year else 'N/A'}
        
        Abstract:
        {abstract}
        
        Please include in your summary:
        1. The main research problem or question
        2. The approach or methodology used
        3. Key innovations or technical contributions
        4. Main results or findings
        5. Potential applications or implications
        
        Limit the summary to 200-250 words and focus on technical aspects.RETURN A PLAIN TEXT ONLY.
        """
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        # Extract and return the summary
        summary = response.text
        return summary
        
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        # Provide a basic summary from the abstract if LLM summarization fails
        if len(abstract) > 300:
            return abstract[:297] + "..."
        return abstract