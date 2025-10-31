from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, SelectField
from wtforms.validators import DataRequired, Length, Optional

class GoalForm(FlaskForm):
    title = StringField("Goal Title", validators=[DataRequired(), Length(max=100)])
    description = TextAreaField("Description", validators=[Length(max=255)])
    category = SelectField(
        "Category",
        choices=[
            ("Health", "Health 💪"),
            ("Study", "Study 📚"),
            ("Work", "Work 💼"),
            ("Personal", "Personal 🌱"),
            ("Finance", "Finance 💰"),
            ("Other", "Other 🌀"),
        ],
        default="Personal",
    )
    repeat_type = SelectField(
        "Repeat",
        choices=[("none", "One-time"), ("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly")],
        default="none",
    )
    target_day = StringField("Target Day", validators=[Optional(), Length(max=20)])
    submit = SubmitField("Add Goal")
