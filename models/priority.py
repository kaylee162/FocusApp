from extensions import db
from flask_login import current_user
from datetime import date

class PriorityGoal(db.Model):
    __tablename__ = "priority_goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    goal_id = db.Column(db.Integer, db.ForeignKey("goal.id"), nullable=False)
    date = db.Column(db.Date, default=date.today)

    def __repr__(self):
        return f"<PriorityGoal goal_id={self.goal_id}>"
