# AcademIQ 🎓

**AcademIQ** is an innovative edtech platform designed to bridge the gaps in traditional education. It offers robust features for both teachers and students, creating a dynamic, interactive, and visually engaging learning environment.

---
<div align='center'>
<img src="Images/Screenshot (124).png" alt="Landing page" width="700"/>
</div>
---

## Table of Contents

- [Overview](#overview)
- [Teacher Side Features](#teacher-side-features)
  - [Course and Lesson Generation 📚](#course-and-lesson-generation-)
  - [Content Creation and Editing ✏️](#content-creation-and-editing-)
  - [Assignment Management ✅](#assignment-management-)
  - [Research Assistant 🔍](#research-assistant-)
  - [Timetable Scheduler 📅](#timetable-scheduler-)
  - [GitHub Explorer Integration 💻](#github-explorer-integration-)
- [Student Side Features](#student-side-features)
  - [Course Recommendations and Generation 🌟](#course-recommendations-and-generation-)
  - [Multilingual Support & Accessibility 🌐](#multilingual-support--accessibility-)
  - [Content Access and Tools 📝](#content-access-and-tools-)
  - [Quizzes and Assessments 🎯](#quizzes-and-assessments-)
  - [Assignment Dashboard 📥](#assignment-dashboard-)
  - [Research Assistant 🔎](#research-assistant-1)
  - [Virtual Assistant and Group Collaboration 🤝](#virtual-assistant-and-group-collaboration-)
- [Getting Started 🚀](#getting-started-)
- [Contributing 🤓](#contributing-)
- [License ⚖️](#license-)

---

## Overview

AcademIQ is a cutting-edge platform that empowers educators and learners alike. By combining AI-powered content generation, interactive learning modules, and seamless integration with external resources, AcademIQ transforms the educational experience. Whether you're a teacher streamlining your course preparation or a student exploring personalized learning paths, AcademIQ is built to elevate your journey.

---

## Teacher Side Features

### Course and Lesson Generation 📚

- **Course Generation:** Create comprehensive courses tailored to your syllabus.
- **Lesson Structuring:** Courses are divided into lessons (each lasting 1 hour).
- **Submodules & Content:** Utilize multimodal RAG to automatically generate submodules with rich content.
- **Resource Input:** Integrate PDFs, links, and live web search results for enhanced learning material.

### Content Creation and Editing ✏️

- **Downloadable Assets:** Receive PPTs per lesson and notes available in PDF format.
- **Lab Manuals:** Automatically generate lab manuals aligned with your syllabus.
- **Multimedia Uploads:** Upload images and other media to enrich your content.
- **Content Editing:** Easily edit and refine generated content to match your teaching style.

### Assignment Management ✅

- **Assignment Creation:** Design and assign tailored assignments.
- **Submission Evaluation:** AI-driven evaluation system assesses student submissions automatically.
- **Performance Tracking:** Monitor individual student marks and progress.

### Research Assistant 🔍

- **Paper Summaries:** Input research topics to receive summaries of the most relevant academic papers.
- **Journal Integration:** Seamlessly connect with journals and research databases for in-depth insights.

### Timetable Scheduler 📅

- **Automated Scheduling:** Generate a well-formatted Excel timetable by inputting classroom and lab availability, teacher details, and more.
- **Efficiency Focused:** Save time and reduce scheduling conflicts with intelligent automation.

### GitHub Explorer Integration 💻

- **Project Sync:** Create projects that mirror GitHub repositories accessible to both teachers and students.
- **Code Review:** Browse repository contents, view commit histories, and track collaborator contributions.
- **Script Evaluation:** Integrated tools for evaluating code scripts streamline the review process.

---

## Student Side Features

### Course Recommendations and Generation 🌟

- **Personalized Recommendations:** Receive AI-generated course suggestions that evolve with your learning data.
- **On-Demand Course Generation:** Generate courses based on your interests or view those shared by teachers using a unique course code.
- **Module Diversity:** Courses are divided into basic and advanced modules to cater to diverse learning levels.

### Multilingual Support & Accessibility 🌐

- **Language Options:** All courses are multilingual, making learning accessible globally.
- **Content Flexibility:** Options to generate audio versions or download courses in PDF format enhance accessibility.

### Content Access and Tools 📝

- **Sticky Notes:** Use virtual sticky notes to jot down ideas and key points directly on your content.
- **Interactive Learning:** Engage with courses using a variety of multimedia formats for a rich learning experience.

### Quizzes and Assessments 🎯

- **Diverse Quizzes:** 
  - **Theory Quiz:** Test your foundational understanding.
  - **Application Quiz:** Assess your practical knowledge.
  - **Interview Quiz:** Prepare for real-world scenarios with interview-style questions.

### Assignment Dashboard 📥

- **Centralized Portal:** Easily access and submit assignments.
- **Real-Time Updates:** Track deadlines, receive feedback, and view evaluation results promptly.

### Research Assistant 🔎

- **Research Summaries:** Similar to the teacher side, receive AI-driven summaries for academic papers that match your research topics.

### Virtual Assistant and Group Collaboration 🤝

- **Multilingual Virtual Assistant:** Get support in multiple languages for a seamless experience.
- **Community Groups:** Create and join groups to chat, collaborate, and share ideas with peers and educators.

---

## Getting Started 🚀

1. **Sign Up:** Register as a teacher or student on the academIQ platform.
2. **Explore Features:** Navigate the dashboard to discover courses, assignments, and collaborative tools.
3. **Customize Your Experience:** Tailor your profile and learning paths to match your educational needs.
4. **Join the Community:** Engage with a vibrant community of educators and learners to share insights and collaborate on projects.

---

## Installation & Setup

### Backend Setup
1. Open a terminal and navigate to the server directory:
   ```sh
   cd /EduNexus-Server/server-side
   ```
2. Create a `.env` file and add the following environment variables:
   ```sh
   GEMINI_API_KEY=""
   GOOGLE_SERP_API_KEY=""
   SERPER_API_KEY=""
   TAVILY_API_KEY1=""
   SECRET_KEY=""
   SCRAPFLY_API_KEY=""
   MONGO_PASS=""
   ```
3. Create a virtual environment:
   ```sh
   python -m venv venv
   ```
4. Activate the virtual environment:
   - On Windows:
     ```sh
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```sh
     source venv/bin/activate
     ```
5. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
6. Run the backend server:
   ```sh
   python app.py
   ```

### Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```sh
   cd /EduNexus-Client/
   ```
2. Install dependencies:
   ```sh
   npm i
   ```
3. Start the frontend server:
   ```sh
   npm run dev
   ```

## License ⚖️

Distributed under the MIT License. See `LICENSE` for more information.

---

Elevate your educational experience with AcademIQ—where innovation meets education.
