import pandas as pd
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
    'monday_10A':[[],["CR1","Mrs Johnson","Maths"],[],[],[],[]],
    'tuesday_10A':[[],[],["CR2","Mrs Johnson","Maths"],[],[],[]],
    and so on...
    'Saturday_10D':[["102","Mr Smith","Science"],[],[],[],[],[]]
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

    # print(response.text)
    return response.text


def save_timetable_to_excel(timetable, start_time="8:30", end_time="17:30"):
    file_path = "timetable.xlsx"
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
        num_slots = max((len(slots) for slots in day_slots.values()), default=0)
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
        num_slots = max((len(slots) for slots in day_slots.values()), default=0)
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
