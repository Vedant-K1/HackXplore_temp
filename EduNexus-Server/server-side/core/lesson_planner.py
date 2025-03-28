from api.gemini_client import GeminiProvider

class LessonPlanner:
    def __init__(self):
        self.gemini_client = GeminiProvider()

    def generate_lesson_plan(self, course_name, context, num_lectures):
        prompt = f"""Given the syllabus context for {course_name} and the total number of lectures {num_lectures}, you are to act as an expert lesson planner. Your task is to divide the syllabus into hour-long lectures, focusing on relevant content only. Exclude any unrelated material, such as textbook names, lab experiments, or content from other subjects from the context. Use the following context:\n- **Context** (This contains the full syllabus text, including relevant and irrelevant material): \n```{context}```. \n\n Structure the output as a JSON object, where the keys of the JSON object is the name of the lesson and the corresponding values are a concise overview of the lecture content. The keys of the JSON object shouldn't be of the format "Lecture 1", "Lecture 2", etc. but it should be the actual name of the topic that the lecture is going to cover. The description should be short and simple (around 2-3 sentences at most) highlighting what the lecture should possibly cover. Generate {num_lectures} such lecture names along with a brief description of each lecture strictly following the given format."""
        result = self.gemini_client.generate_json_response(prompt=prompt)
        return result