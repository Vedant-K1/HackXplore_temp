import React, { useState } from 'react';
import TimetableVisualizer from './TimetableVisualizer';

function App() {
  const [timetableData, setTimetableData] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    numClassrooms: 3,
    classes: ['10A', '10B', '10C'],
    startTime: '08:30',
    endTime: '17:30',
    subjects: [
      { name: 'Mathematics', totalHours: 6, teachers: ['Mr. Smith'], maxDailyHours: 2 },
      { name: 'Science', totalHours: 6, teachers: ['Ms. Johnson'], maxDailyHours: 2 },
      { name: 'English', totalHours: 5, teachers: ['Mrs. Brown'], maxDailyHours: 2 },
      { name: 'History', totalHours: 4, teachers: ['Mr. Davis'], maxDailyHours: 2 },
      { name: 'Physical Education', totalHours: 3, teachers: ['Coach Williams'], maxDailyHours: 1 }
    ]
  });

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    
    setFormData(prevFormData => {
      // Create a new subjects array to avoid direct mutation
      const newSubjects = [...prevFormData.subjects];
      
      // Handle different input types
      if (field === 'classes') {
        return {
          ...prevFormData,
          classes: value.split(',').map(cls => cls.trim())
        };
      }
      
      if (index !== null && field) {
        // Update specific subject field
        newSubjects[index] = {
          ...newSubjects[index],
          [field]: field === 'teachers' 
            ? value.split(',').map(teacher => teacher.trim())
            : (field === 'totalHours' || field === 'maxDailyHours')
              ? Number(value)
              : value
        };
        
        return {
          ...prevFormData,
          subjects: newSubjects
        };
      }
      
      // Handle top-level fields
      return {
        ...prevFormData,
        [field]: value
      };
    });
  };

  const handleAddSubject = () => {
    setFormData(prevFormData => ({
      ...prevFormData,
      subjects: [
        ...prevFormData.subjects,
        { name: '', totalHours: 0, teachers: [''], maxDailyHours: 1 }
      ]
    }));
  };

  const handleRemoveSubject = (indexToRemove) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      subjects: prevFormData.subjects.filter((_, index) => index !== indexToRemove)
    }));
  };

  const fetchTimetableData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/generate-timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setTimetableData(data);
    } catch (err) {
      console.error("Failed to fetch timetable:", err);
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Timetable Generator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Configuration */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">Number of Classrooms</label>
            <input 
              type="number" 
              value={formData.numClassrooms}
              onChange={(e) => handleInputChange(e, null, 'numClassrooms')}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2">Classes (comma-separated)</label>
            <input 
              type="text" 
              value={formData.classes.join(', ')}
              onChange={(e) => handleInputChange(e, null, 'classes')}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2">Start Time</label>
            <input 
              type="time" 
              value={formData.startTime}
              onChange={(e) => handleInputChange(e, null, 'startTime')}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2">End Time</label>
            <input 
              type="time" 
              value={formData.endTime}
              onChange={(e) => handleInputChange(e, null, 'endTime')}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        {/* Subjects Configuration */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Subjects Configuration</h3>
            <button 
              onClick={handleAddSubject}
              className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600"
            >
              Add Subject
            </button>
          </div>
          
          {formData.subjects.map((subject, index) => (
            <div 
              key={index} 
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-md relative"
            >
              <button 
                onClick={() => handleRemoveSubject(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                &times;
              </button>
              
              <div>
                <label className="block text-gray-700 font-bold mb-2">Subject Name</label>
                <input 
                  type="text" 
                  value={subject.name}
                  onChange={(e) => handleInputChange(e, index, 'name')}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Total Hours</label>
                <input 
                  type="number" 
                  value={subject.totalHours}
                  onChange={(e) => handleInputChange(e, index, 'totalHours')}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Teachers (comma-separated)</label>
                <input 
                  type="text" 
                  value={subject.teachers.join(', ')}
                  onChange={(e) => handleInputChange(e, index, 'teachers')}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Max Daily Hours</label>
                <input 
                  type="number" 
                  value={subject.maxDailyHours}
                  onChange={(e) => handleInputChange(e, index, 'maxDailyHours')}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <button 
            onClick={fetchTimetableData}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Generate Timetable
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {timetableData && <TimetableVisualizer initialData={timetableData} />}
    </div>
  );
}

export default App;