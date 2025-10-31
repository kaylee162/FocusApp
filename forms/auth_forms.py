from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length


class SignUpForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(min=2, max=50)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField("Confirm Password", validators=[DataRequired(), EqualTo("password")])
    submit = SubmitField("Sign Up")

class LoginForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(min=2, max=50)])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Login")

