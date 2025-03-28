from flask import Flask, jsonify, request
from flask_cors import CORS
from try_tt import TimetableGenerator  # Import from previous script

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

@app.route('/api/generate-timetable', methods=['POST'])
def generate_timetable():
    # Get configuration from request
    config = request.json
    
    # Prepare subjects dictionary
    subjects = {
        subject['name']: {
            'total_hours': subject['totalHours'],
            'teachers': subject['teachers'],
            'max_daily_hours': subject['maxDailyHours']
        } for subject in config.get('subjects', [])
    }
    
    # Initialize timetable generator with provided configuration
    generator = TimetableGenerator(
        num_classrooms=config.get('numClassrooms', 3),
        classes=config.get('classes', ['10A', '10B', '10C']),
        start_time=config.get('startTime', '08:30'),
        end_time=config.get('endTime', '17:30'),
        subjects=subjects
    )
    
    print("Generating timetable...")
    
    # Generate timetable
    timetable = generator.generate_timetable()
    timetable['startTime'] = config.get('startTime', '08:30')

    return jsonify(timetable)

if __name__ == '__main__':
    app.run(debug=True, port=5000)