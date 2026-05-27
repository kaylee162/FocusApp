from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField, SelectMultipleField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional


class SignUpForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(min=2, max=50)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField("Confirm Password", validators=[DataRequired(), EqualTo("password")])
    submit = SubmitField("Create Account")


class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(min=2, max=50)])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Login")


class OnboardingForm(FlaskForm):
    sidekick_name = StringField("Sidekick name", validators=[DataRequired(), Length(min=1, max=24)])
    sidekick_character = SelectField(
        "Choose your sidekick",
        choices=[
            ("dino", "Dino"),
            ("fox", "Fox"),
            ("panda", "Panda"),
            ("cow", "Cow"),
        ],
        validators=[DataRequired()],
    )
    habit_categories = SelectMultipleField(
        "Habit focus areas",
        choices=[
            ("focus", "Focus & studying"),
            ("wellness", "Wellness"),
            ("movement", "Movement"),
            ("chores", "Chores & routines"),
            ("creativity", "Creativity"),
            ("mindfulness", "Mindfulness"),
        ],
        validators=[Optional()],
    )
    submit = SubmitField("Start Tracking")
