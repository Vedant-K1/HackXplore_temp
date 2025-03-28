from api.gemini_client import GeminiProvider
from api.tavily_client import TavilyProvider

class SkillsAnalyzer:
    def __init__(self):
        self.gemini_client = GeminiProvider()
        self.tavily_client = TavilyProvider()

    def fetch_extract_demand_skills(self, job_title):
        query = f"What are the in-demand skills for {job_title}?"
        web_information = self.tavily_client.search_context(query)
        prompt=f"""You're a expert labor market analyst. You will be given a job title and information from the internet. Your task is to analyze the web information to extract the most in-demand skills required for the job role and assign a score out of 100 signifying the importance of the skill in the job market.\n\n**Input:**\n**Job Title:** {job_title}\n**Web Information:** ```{web_information}```\n\nThe output should be in json format where the key corresponds to the the skill name and the value represents the demand out of 100."""
        response = self.gemini_client.generate_json_response(prompt)
        return response
    
    def find_job_roles_from_interests(self, interests: list):
        query= "What are the trending job roles when my interests are " + interests[0] + ', '.join(interests[1:]) + "?"
        web_information = self.tavily_client.search_context(query)
        prompt=f"""You are a skilled job market researcher. You will receive a list of interests and a block of text containing web information about trending job roles related to those interests. Your task is to extract all the job roles (relevant to the interests) mentioned in the web information as well as provide a detailed description of each job role.\n\n**Input:**\n**Interests:** [ Data Analysis, Project Management, Graphic Design, Cybersecurity, Machine Learning ]\n**Web Information:** ```{web_information}```\n\n"""
        prompt += """**Example output format:**\n
{
  "Data Scientist": "A Data Scientist leverages statistical techniques, machine learning, and domain expertise to analyze and interpret large datasets. They are responsible for extracting meaningful insights, building predictive models, and presenting data-driven solutions to inform business decisions. Key skills include programming (Python, R), data visualization, and working with big data tools like Hadoop and Spark.",
  
  "Machine Learning Engineer": "Machine Learning Engineers focus on designing, developing, and deploying machine learning models and algorithms into production. They collaborate with data scientists to refine models and ensure scalability and performance. Expertise in deep learning frameworks (TensorFlow, PyTorch), cloud platforms, and software engineering practices is essential for this role.",
  
  "Cloud Architect": "Cloud Architects design and manage cloud infrastructure, ensuring scalability, security, and cost-efficiency of cloud-based solutions. They develop cloud strategies, oversee deployment, and manage services on platforms like AWS, Azure, and Google Cloud. Strong knowledge of networking, containerization, and DevOps practices is required.",
  
  "Data Analyst": "Data Analysts interpret data, generate reports, and provide actionable insights to support business decisions. They work with tools like SQL, Excel, and data visualization platforms (Tableau, Power BI) to analyze trends and patterns. This role requires strong analytical skills, attention to detail, and the ability to communicate findings clearly.",
  
  "Web Developer": "Web Developers build and maintain websites and web applications, ensuring functionality, user experience, and performance. They work with front-end and back-end technologies, including HTML, CSS, JavaScript, and frameworks like React or Django. Knowledge of responsive design and web accessibility standards is crucial.",
  
  "Cybersecurity Analyst": "Cybersecurity Analysts protect an organization’s systems and data from cyber threats by monitoring networks, investigating breaches, and implementing security protocols. They conduct vulnerability assessments, manage firewalls, and ensure compliance with security standards. Skills in threat analysis, encryption, and risk management are vital."
}"""
        prompt+="""Ensure that the job roles are relevant to the interests provided. The output should be a JSON with the key corresponding to the relevant job role extracted and the value being a detailed description of the extracted job role."""
        response = self.gemini_client.generate_json_response(prompt)
        return response
    
    def find_job_roles_from_student_skills(self, skills: list):
        query= "What are the trending job roles based on my skills which are " + skills[0]+ ', '.join(skills[1:]) + "?"
        web_information = self.tavily_client.search_context(query)
        prompt=f"""You are a skilled job market researcher. You will receive a list of student's skills and a block of text containing web information about trending job roles related to those skills. Your task is to extract all the job roles (relevant to the student skills) mentioned in the web information as well as provide a detailed description of each job role.\n\n**Input:**\n**Skills:** [ Data Analysis, Project Management, Graphic Design, Cybersecurity, Machine Learning ]\n**Web Information:** ```{web_information}```\n\n"""
        prompt += """**Example output format:**\n
{
  "Data Scientist": "A Data Scientist leverages statistical techniques, machine learning, and domain expertise to analyze and interpret large datasets. They are responsible for extracting meaningful insights, building predictive models, and presenting data-driven solutions to inform business decisions. Key skills include programming (Python, R), data visualization, and working with big data tools like Hadoop and Spark.",
  
  "Machine Learning Engineer": "Machine Learning Engineers focus on designing, developing, and deploying machine learning models and algorithms into production. They collaborate with data scientists to refine models and ensure scalability and performance. Expertise in deep learning frameworks (TensorFlow, PyTorch), cloud platforms, and software engineering practices is essential for this role.",
  
  "Cloud Architect": "Cloud Architects design and manage cloud infrastructure, ensuring scalability, security, and cost-efficiency of cloud-based solutions. They develop cloud strategies, oversee deployment, and manage services on platforms like AWS, Azure, and Google Cloud. Strong knowledge of networking, containerization, and DevOps practices is required.",
  
  "Data Analyst": "Data Analysts interpret data, generate reports, and provide actionable insights to support business decisions. They work with tools like SQL, Excel, and data visualization platforms (Tableau, Power BI) to analyze trends and patterns. This role requires strong analytical skills, attention to detail, and the ability to communicate findings clearly.",
  
  "Web Developer": "Web Developers build and maintain websites and web applications, ensuring functionality, user experience, and performance. They work with front-end and back-end technologies, including HTML, CSS, JavaScript, and frameworks like React or Django. Knowledge of responsive design and web accessibility standards is crucial.",
  
  "Cybersecurity Analyst": "Cybersecurity Analysts protect an organization’s systems and data from cyber threats by monitoring networks, investigating breaches, and implementing security protocols. They conduct vulnerability assessments, manage firewalls, and ensure compliance with security standards. Skills in threat analysis, encryption, and risk management are vital."
}"""
        prompt += """Ensure that the job roles are relevant to the student's provided skills. The output should be a JSON with the key corresponding to the relevant job role extracted and the value being a detailed description of the extracted job role."""
        response = self.gemini_client.generate_json_response(prompt)
        return response
    
    def analyze_skill_gap(self, job_role : str, students_current_skills : dict, required_skills : dict):
        prompt = """You are a skilled human resources analyst performing a weighted skill gap analysis.  You will receive a target job role, required skills with their importance, and the user's current skills with their proficiency levels. Your task is to identify skill gaps, transferable skills, and provide a detailed report in JSON format.

**Instructions:**

1. **Input Data:**
    * **Target Job Role:** (String) The job title.
    * **Required Skills:** (Dictionary) Skill names (keys) and importance (0-10, values).
    * **User's Current Skills:** (Dictionary) Skill names (keys) and proficiency (0-10, values).

2. **Weighted Skill Gap Analysis:**
    * Prioritize skills with higher weightage.
    * Compare user proficiency to skill importance. A large difference indicates a significant gap.
    * Consider low proficiency skills, even with low weightage.

3. **Transferable Skills Identification:**
    * Analyze user skills for transferability to the target role.
    * For each transferable skill, explain its relevance and potential contribution.

4. **Output Format (JSON):**
    * `"transferable_skills"`: (Dictionary)  A dictionary where the key is the name of the transferable skill and the value is the explanation of why that skill is transferable and how it can in the given job role. Should be NA if there are no transferable skills.
    * `"required_skill_development"`: (Dictionary)  A dictionary with the key being the skill name and the value being why it's important for the role and what the user needs to develop
    * `"journey_assessment"`: (Dictionary) **key 1:** "level" with the value being the difficulty level of the journey (should be one of 'easy', 'easy-moderate', 'moderate', 'moderate-difficult', 'difficult'). **key 2:** "justification** with the value being the justification of the difficulty assessment.


**Example Output:**

```json
{
  "transferable_skills": {
    "Software Development": "Experience with software development can enhance understanding of project lifecycles and technical aspects, contributing to better planning and team coordination."
  },
  "required_skill_development": {
    "Project Planning": "Crucial for organizing projects effectively. You need to improve your skills in creating detailed project plans, defining milestones, and managing resources.",
    "Team Leadership": "Essential for guiding and motivating teams. You need to develop leadership skills, including delegation, conflict resolution, and team building.",
    "Risk Management": "Important for identifying and mitigating potential project risks. You need to learn risk assessment techniques, develop mitigation strategies, and implement risk monitoring processes.",
    "Communication": "While you have good communication skills, focus on tailoring communication to different stakeholders and improving your presentation skills."
  },
  "journey_assessment": {
  "level": "moderate",
  "justification" : "Given your current skillset, which shows strength in communication and some project planning experience, coupled with the transferable skills from software development, your career journey is estimated to be Moderate. You have significant gaps in team leadership and risk management, requiring focused development. However, your existing skills and transferable experience provide a good foundation to build upon."
}\n\n"""
        prompt+= f"**Input:**\nJob Role: {job_role}\n\nRequired Skills :\n" + "{\n"
        for key, val in required_skills.items():
            prompt+= f"  '{key}' : {int(val)/10},\n"
        prompt += "}\n\nUser's Current Skills:\n{\n"
        for key, val in students_current_skills.items():
            prompt+= f"  '{key}' : {val},\n"
        prompt += "}"
        response = self.gemini_client.generate_json_response(prompt)
        return response