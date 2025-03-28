import React, { useState } from 'react';

const TimetableVisualizer = ({ initialData }) => {
  const [timetableData] = useState(initialData);
  const [activeTab, setActiveTab] = useState('lectures');

  const getTimeSlot = (slot) => {
    // Assuming each slot is 1 hour
    const [startHour, startMinute] = timetableData.startTime.split(':').map(Number);
    const slotStartHour = startHour + slot;
    const formatTime = (hour) => (hour < 10 ? `0${hour}` : hour) + ':' + (startMinute < 10 ? `0${startMinute}` : startMinute);
    return `${formatTime(slotStartHour)} - ${formatTime(slotStartHour + 1)}`;
  };
  
    
  // Aggregate lectures by teacher
  const teacherLectures = timetableData.lectures.reduce((acc, lecture) => {
    if (!acc[lecture.teacher]) {
      acc[lecture.teacher] = [];
    }
    acc[lecture.teacher].push(lecture);
    return acc;
  }, {});

  const renderLecturesTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Lecture Schedule</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              {['Teacher', 'Subject', 'Class', 'Classroom', 'Day', 'Slot'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timetableData.lectures.map((lecture, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{lecture.teacher}</td>
                <td className="px-6 py-4 whitespace-nowrap">{lecture.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap">{lecture.class}</td>
                <td className="px-6 py-4 whitespace-nowrap">{lecture.classroom}</td>
                <td className="px-6 py-4 whitespace-nowrap">{lecture.day}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getTimeSlot(lecture.slot)}</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeacherSchedules = () => (
    <div className="space-y-6">
      {Object.entries(teacherLectures).map(([teacher, lectures]) => (
        <div key={teacher} className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{teacher}'s Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {['Subject', 'Class', 'Classroom', 'Day', 'Slot'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lectures.map((lecture, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{lecture.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lecture.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lecture.classroom}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lecture.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTimeSlot(lecture.slot)}</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  const renderClassroomSchedules = () => (
    <div className="space-y-6">
      {Object.entries(timetableData.classrooms).map(([classroom, days]) => (
        <div key={classroom} className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{classroom} Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slots</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(days).map(([day, slots]) => (
                  <tr key={day} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{day}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    {slots.map((slot, index) => 
                      slot.length > 0 
                        ? `${getTimeSlot(index)}: ${slot[0]} - ${slot[1]}` 
                        : `${getTimeSlot(index)}: `
                    ).join(' | ')}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHourDifferencesTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Subject Hour Differences</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              {['Class', 'Subject', 'Hour Difference'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(timetableData.subject_hours_difference).flatMap(([className, subjects]) => 
              Object.entries(subjects).map(([subject, difference], index) => (
                <tr key={`${className}-${subject}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{className}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{difference}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex space-x-4 overflow-x-auto">
        {[
          'lectures', 
          'teacher-schedules', 
          'classroom-schedules', 
          'hour-differences'
        ].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'lectures' && renderLecturesTable()}
        {activeTab === 'teacher-schedules' && renderTeacherSchedules()}
        {activeTab === 'classroom-schedules' && renderClassroomSchedules()}
        {activeTab === 'hour-differences' && renderHourDifferencesTable()}
      </div>
    </div>
  );
};

export default TimetableVisualizer;