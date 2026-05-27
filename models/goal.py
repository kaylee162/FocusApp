from extensions import db
from flask_login import current_user
from datetime import datetime
from zoneinfo import ZoneInfo

eastern = ZoneInfo("America/New_York")


class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    category = db.Column(db.String(50), default="General")   # 🆕 Category
    is_completed = db.Column(db.Boolean, default=False)

    repeat_type = db.Column(db.String(20), default="none")   # daily, weekly, monthly
    target_day = db.Column(db.String(20), nullable=True)
    last_reset = db.Column(db.DateTime, default=lambda: datetime.now(eastern))

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(eastern))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(eastern),
        onupdate=lambda: datetime.now(eastern)
    )

    def __repr__(self):
        return f"<Goal {self.title} ({self.repeat_type})>"


class GoalCompletion(db.Model):
    __tablename__ = "goal_completions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    goal_id = db.Column(db.Integer, db.ForeignKey("goal.id"), nullable=False)
    completed_on = db.Column(db.Date, nullable=False)
    completed_at = db.Column(db.DateTime, default=lambda: datetime.now(eastern))

    goal = db.relationship("Goal", backref=db.backref("completion_logs", cascade="all, delete-orphan"))

    __table_args__ = (
        db.UniqueConstraint("user_id", "goal_id", "completed_on", name="unique_goal_completion_per_day"),
    )

    def __repr__(self):
        return f"<GoalCompletion goal_id={self.goal_id} completed_on={self.completed_on}>"
