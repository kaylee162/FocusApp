from flask import Blueprint, render_template, redirect, url_for, flash, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models.user import User
from forms.auth_forms import SignUpForm, LoginForm

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    # Redirect if user already logged in
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    form = SignUpForm()

    if form.validate_on_submit():
        # Check if username already exists
        existing_user = User.query.filter_by(username=form.username.data).first()
        if existing_user:
            flash("Username already exists. Please choose another.", "error")
            return render_template("auth/signup.html", form=form)

        # Basic email validation (simple check)
        if "@" not in form.email.data:
            flash("Please enter a valid email address.", "error")
            return render_template("auth/signup.html", form=form)

        # Password match check
        if form.password.data != form.confirm_password.data:
            flash("Passwords do not match.", "error")
            return render_template("auth/signup.html", form=form)

        # Create new user if all checks pass
        hashed_pw = generate_password_hash(form.password.data)
        user = User(username=form.username.data, email=form.email.data, password=hashed_pw)
        db.session.add(user)
        db.session.commit()

        flash("Account created successfully! You can now log in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/signup.html", form=form)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        if user and check_password_hash(user.password, form.password.data):
            login_user(user)
            flash("Welcome back!", "success")
            return redirect(url_for("main.dashboard"))
        else:
            flash("Invalid username or password.", "error")

    return render_template("auth/login.html", form=form)


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You’ve been logged out.", "info")
    return redirect(url_for("main.index"))
