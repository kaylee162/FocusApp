from extensions import db
from flask_login import current_user
from datetime import date

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, default=date.today)

    def __repr__(self):
        return f"<Task {self.title}>"
