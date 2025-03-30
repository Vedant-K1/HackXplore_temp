import { Route, Routes, Navigate } from "react-router-dom";
import HomePage from "./pages/Landing";
import CoursePage from "./pages/teacher/course/course";
import CourseCreate from "./pages/teacher/Coursecreate";
import LessonCreate from "./pages/teacher/Lessoncreate"
import Testing from "./pages/testing";

import Login from "./pages/Login"
import Register from "./pages/register/Register"
import Pico from "./pages/Pico"
import Home from "./pages/student/Home";
import Explore from "./pages/student/Explore"
import CourseOverview from "./pages/student/CourseOverview"

import Content from "./pages/student/content/Content";
import LabManual from "./pages/teacher/course/Lab Manual/LabManual";
import LabManualCreate from "./pages/teacher/course/Lab Manual/LabManualCreate";
import "./pages/student/content/i18n"
import LessonsGrid from "./pages/teacher/scheduler";
import Studentscheduler from "./pages/student/Studentscheduler";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import SharedCourses from "./pages/student/SharedCourses";
import PerContent from "./pages/student/course/course";
import StudentLabManual from "./pages/student/course/Lab Manual/LabManual";
import TimetableForm from "./pages/teacher/generate_timetable.tsx";
import CreateAssignment from "./pages/teacher/CreateAssignment.tsx";
import Assignment from "./pages/Assignment.tsx";
function App() {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/" />} />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />

      <Route element={<HomePage />} path="/" />
      <Route element={<TeacherDashboard />} path="/teacher/dashboard" />
      <Route element={<CourseCreate />} path="/teacher/create-course" />
      <Route element={<LessonCreate />} path="/teacher/create-lesson" />
      <Route element={<CreateAssignment />} path="/teacher/create-assignment" />
      <Route element={<CoursePage />} path="/teacher/course" />
      <Route element={<LabManual />} path="/teacher/lab-manual" />
      <Route element={<LabManualCreate />} path="/teacher/lab-manual-create" />
      <Route element={<LessonsGrid />} path="/teacher/scheduler" />
      <Route element={<TimetableForm />} path="/teacher/timetable" />
      
      <Route element={<Testing />} path="/testing" />
      <Route element={<Pico />} path="/pico" />
      <Route element={<Home />} path="/student/home" />
      <Route element={<Studentscheduler />} path="/student/scheduler" />
      <Route element={<Assignment />} path="/student/assignment" />
      <Route element={<SharedCourses />} path="/student/shared-courses" />
      <Route element={<Explore />} path="/student/explore" />
      <Route element={<CourseOverview />} path="/student/course-overview" />
      <Route element={<Content />} path="/student/content" />
      <Route element={<PerContent />} path="/student/shared-lesson" />
      <Route element={<StudentLabManual />} path="/student/shared-lab-manual" />
    </Routes>
  );
}

export default App;
