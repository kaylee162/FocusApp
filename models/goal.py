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
