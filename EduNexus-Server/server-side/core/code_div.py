import pandas as pd
from flask import Flask, request, jsonify, send_file
import json
from google import genai

def generate_timetable(teachers_subjects, hours_per_week, preferred_slots, classrooms, lab_requirements, start_time, end_time):
    client = genai.Client(api_key="AIzaSyAl03NHDQ6gnXrXZKm_E3OiX7O-d8Bn_YQ")

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
    
    Example:
    teachers_subjects = {teachers_subjects} 
    hours_per_week = {hours_per_week}  

    2. **Preferred Time Slots**  
    - The preferred days and hours for each teacher.  
    - Any unavailable slots for specific teachers.  

    Example:
    preferred_slots = {preferred_slots} 

    3. **Classrooms and Labs**  
    - The total number of classrooms and labs available.  
    - The subjects that require specific lab allocations (e.g., Computer Science needs a computer lab).  

    Example:
    classrooms = {classrooms}  
    lab_requirements = {lab_requirements}  

    4. **College Timings**  
    - The start and end times of the academic day.  
    - Each lecture lasts **1 hour**, while lab sessions last **2 hours**.  

    Example:
    start_time = {start_time}  # Integer (e.g., 9 for 9:00 AM)
    end_time = {end_time}  # Integer (e.g., 17 for 5:00 PM)

    Constraints to Follow:
    1.No teacher should have overlapping lectures.
    2.No class should have overlapping subjects at the same time.
    3.A classroom or lab should not be double-booked.
    4.Ensure that all teaching hours per week are met for each subject.
    5.Prioritize teacher preferences when possible.

    ### **Output Format:**  
    The timetable should be structured in JSON format as follows:  

    ```json
    'teachers':{{

    'monday_Mrs Johnson':[[],["CR1","10A","Maths"],[],[],["Lab1","10B","Computer"],["Lab1","10B","Computer"]],
    'tuesday_Mrs Johnson':[[],[],["CR2","10A","Maths"],[],[],[]],
    and so on....
    'Saturday_Mr Smith': [["CR1","10D","Science"],["CR1","10B","Science"],[],[],[],[]]
    }}
    'Classes':{{
    'monday_10A':[[],["Mrs Johnson","Maths"],[],[],[],[]],
    'tuesday_10A':[[],[],["CR2","10A","Maths"],[],[],[]],
    and so on...
    'Saturday_10D':[["Mr Smith","Science"],[],[],[],[],[]]
    }}```
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

    print("Response received")
    return response.text


import pandas as pd

def save_timetable_to_excel(timetable):
    file_path = "timetable.xlsx"
    with pd.ExcelWriter(file_path, engine='xlsxwriter') as writer:
        workbook = writer.book
        cell_format = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter'})
        header_format = workbook.add_format({'bold': True, 'border': 1, 'align': 'center', 'valign': 'vcenter', 'bg_color': '#D7E4BC'})
        
        for key, schedule in timetable.items():
            df = pd.DataFrame.from_dict(schedule, orient='index')
            df.fillna('', inplace=True)  # Replace NaN values with empty strings
            
            sheet_name = key.capitalize()
            df.to_excel(writer, sheet_name=sheet_name, index=True, header=True)
            worksheet = writer.sheets[sheet_name]
            
            # Apply formatting to header
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num + 1, value, header_format)  # Write headers with formatting
                worksheet.set_column(col_num + 1, col_num + 1, 20)  # Adjust column width
            
            # Apply formatting and fix list values
            for row_num in range(len(df)):
                for col_num in range(len(df.columns)):
                    cell_value = df.iloc[row_num, col_num]
                    
                    # If the value is a list, convert it to a string
                    if isinstance(cell_value, list):
                        cell_value = ", ".join(map(str, cell_value))

                    worksheet.write(row_num + 1, col_num + 1, cell_value, cell_format)  # Apply formatting
    
    print("Excel generated")
    return file_path