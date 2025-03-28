import random
from typing import List, Dict, Any

class TimetableGenerator:
    def __init__(self, 
                 num_classrooms: int = 5, 
                 start_time: str = '08:30', 
                 end_time: str = '17:30',
                 classes: List[str] = ['10A', '10B', '10C'],
                 subjects: Dict[str, Dict[str, Any]] = None,
                 days: List[str] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']):
        """
        Initialize timetable generator with enhanced scheduling parameters
        """
        self.num_classrooms = num_classrooms
        self.start_time = start_time
        self.end_time = end_time
        self.classes = classes
        self.days = days
        
        # Default subjects if not provided
        self.subjects = subjects or {
            'Mathematics': {'total_hours': 6, 'teachers': ['Mr. Smith'], 'max_daily_hours': 2},
            'Science': {'total_hours': 6, 'teachers': ['Ms. Johnson'], 'max_daily_hours': 2},
            'English': {'total_hours': 5, 'teachers': ['Mrs. Brown'], 'max_daily_hours': 2},
            'History': {'total_hours': 4, 'teachers': ['Mr. Davis'], 'max_daily_hours': 2},
            'Physical Education': {'total_hours': 3, 'teachers': ['Coach Williams'], 'max_daily_hours': 1}
        }
        
        # Calculate total possible slots
        self.calculate_daily_slots()
        
    def calculate_daily_slots(self):
        """
        Calculate available slots based on start and end times
        """
        start_hour = int(self.start_time.split(':')[0])
        end_hour = int(self.end_time.split(':')[0])
        
        # Assuming each slot is 1 hour
        self.total_daily_slots = end_hour - start_hour
        
    def generate_timetable(self):
        """
        Advanced timetable generation with balanced distribution
        """
        # Track resource usage
        teacher_schedule = {teacher: {day: 0 for day in self.days} for subject in self.subjects.values() for teacher in subject['teachers']}
        classroom_schedule = {f'CR{i}': {day: [] for day in self.days} for i in range(1, self.num_classrooms + 1)}
        class_schedule = {cls: {day: [] for day in self.days} for cls in self.classes}
        subject_hours = {cls: {subject: 0 for subject in self.subjects.keys()} for cls in self.classes}
        
        # Lectures to be scheduled
        lectures = []
        
        # Generate lectures for each subject
        for subject, subject_info in self.subjects.items():
            total_hours = subject_info['total_hours']
            teachers = subject_info['teachers']
            max_daily_hours = subject_info.get('max_daily_hours', 2)
            
            # Randomize teacher and class assignment
            hours_left = total_hours
            while hours_left > 0:
                # Randomly select teacher and class
                teacher = random.choice(teachers)
                target_class = random.choice(self.classes)
                
                # Find a suitable day with available slots
                available_days = [
                    day for day in self.days 
                    if (teacher_schedule[teacher][day] < max_daily_hours and 
                        len(class_schedule[target_class][day]) < max_daily_hours)
                ]
                
                if not available_days:
                    break
                
                selected_day = random.choice(available_days)
                
                # Find an available classroom
                available_classrooms = [
                    f'CR{i}' for i in range(1, self.num_classrooms + 1)
                    if len(classroom_schedule[f'CR{i}'][selected_day]) < max_daily_hours
                ]
                
                if not available_classrooms:
                    continue
                
                selected_classroom = random.choice(available_classrooms)
                
                # Determine slot
                
                # New code: Check slots used in the chosen classroom and for the target class
                used_classroom_slots = set(
                    lecture['slot'] for lecture in lectures 
                    if lecture['day'] == selected_day and lecture['classroom'] == selected_classroom
                )
                used_class_slots = set(
                    lecture['slot'] for lecture in lectures 
                    if lecture['day'] == selected_day and lecture['class'] == target_class
                )
                available_slots = [
                    slot for slot in range(self.total_daily_slots) 
                    if slot not in used_classroom_slots and slot not in used_class_slots
                ]

                
                #-------------------
                if not available_slots:
                    continue
                
                selected_slot = random.choice(available_slots)
                
                # Create lecture
                lecture = {
                    'teacher': teacher,
                    'subject': subject,
                    'class': target_class,
                    'classroom': selected_classroom,
                    'day': selected_day,
                    'slot': selected_slot
                }
                
                # Update schedules
                teacher_schedule[teacher][selected_day] += 1
                classroom_schedule[selected_classroom][selected_day].append((subject, target_class))
                class_schedule[target_class][selected_day].append((subject, selected_classroom))
                subject_hours[target_class][subject] += 1
                
                lectures.append(lecture)
                hours_left -= 1
        
        # Analyze subject hour differences
        subject_hours_difference = {}
        for cls in self.classes:
            subject_hours_difference[cls] = {}
            for subject in self.subjects.keys():
                expected_hours = self.subjects[subject]['total_hours'] // len(self.classes)
                actual_hours = subject_hours[cls][subject]
                subject_hours_difference[cls][subject] = actual_hours - expected_hours
        
        return {
            'lectures': lectures,
            'classrooms': classroom_schedule,
            'subject_hours_difference': subject_hours_difference
        }

def main():
    # Initialize and generate timetable
    generator = TimetableGenerator(
        num_classrooms=3,
        classes=['10A', '10B', '10C']
    )
    
    # Generate timetable
    timetable = generator.generate_timetable()
    
    # Print lectures
    print("Lectures:")
    for lecture in timetable['lectures']:
        print(f"{lecture['teacher']} - {lecture['subject']} - {lecture['class']} - {lecture['classroom']} - {lecture['day']} - Slot {lecture['slot']}")

    
    print("\nClassroom Availability:")
    for classroom, days in timetable['classrooms'].items():
        print(f"\n{classroom}:")
        for day, slots in days.items():
            print(f"{day}: {slots}")
    
    print("\nSubject Hour Differences:")
    for cls, subjects in timetable['subject_hours_difference'].items():
        print(f"\n{cls}:")
        for subject, difference in subjects.items():
            print(f"{subject}: {difference}")

if __name__ == "__main__":
    main()