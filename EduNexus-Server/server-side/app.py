from server import create_app, socketio
app = create_app()

with app.app_context():
    from server import db
    db.create_all()

if __name__=="__main__":
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
    # app.run(debug=True,port=5000)