from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models.user import User
from forms.auth_forms import SignUpForm, LoginForm, OnboardingForm
from sqlalchemy.exc import IntegrityError

VALID_SIDEKICKS = {"dino", "fox", "panda", "cow"}

auth_bp = Blueprint("auth", __name__)


def clean_sidekick_name(name):
    cleaned = (name or "").strip()
    return cleaned[:24] or "Mochi"


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        if not current_user.onboarding_complete:
            return redirect(url_for("auth.onboarding"))
        return redirect(url_for("main.dashboard"))

    form = SignUpForm()

    if form.validate_on_submit():
        existing_user = User.query.filter_by(username=form.username.data).first()
        if existing_user:
            flash("Username already exists. Please choose another.", "error")
            return render_template("auth/signup.html", form=form)

        existing_email = User.query.filter_by(email=form.email.data).first()
        if existing_email:
            flash("An account with that email already exists. Please use another email or log in.", "error")
            return render_template("auth/signup.html", form=form)

        hashed_pw = generate_password_hash(form.password.data)
        user = User(
            username=form.username.data,
            email=form.email.data,
            password=hashed_pw,
            onboarding_complete=False,
        )
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            flash("That username or email is already in use.", "error")
            return render_template("auth/signup.html", form=form)

        login_user(user)
        flash("Account created! Now choose your sidekick.", "success")
        return redirect(url_for("auth.onboarding"))

    return render_template("auth/signup.html", form=form)


@auth_bp.route("/onboarding", methods=["GET", "POST"])
@login_required
def onboarding():
    form = OnboardingForm()

    if request.method == "GET":
        form.sidekick_name.data = current_user.sidekick_name or "Mochi"
        form.sidekick_character.data = current_user.sidekick_character or "dino"
        form.habit_categories.data = (current_user.habit_categories or "").split(",") if current_user.habit_categories else []

    if form.validate_on_submit():
        character = form.sidekick_character.data
        if character not in VALID_SIDEKICKS:
            character = "dino"

        current_user.sidekick_name = clean_sidekick_name(form.sidekick_name.data)
        current_user.sidekick_character = character
        current_user.habit_categories = ",".join(form.habit_categories.data or [])
        current_user.onboarding_complete = True
        db.session.commit()

        flash("Your sidekick is ready!", "success")
        return redirect(url_for("main.dashboard"))

    return render_template("auth/onboarding.html", form=form)


@auth_bp.route("/sidekick/name", methods=["POST"])
@login_required
def update_sidekick_name():
    name = request.form.get("sidekick_name")
    current_user.sidekick_name = clean_sidekick_name(name)
    db.session.commit()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"name": current_user.sidekick_name})

    flash("Sidekick name updated.", "success")
    return redirect(url_for("main.dashboard"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        if not current_user.onboarding_complete:
            return redirect(url_for("auth.onboarding"))
        return redirect(url_for("main.dashboard"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        if user and check_password_hash(user.password, form.password.data):
            login_user(user)
            flash("Welcome back!", "success")
            if not user.onboarding_complete:
                return redirect(url_for("auth.onboarding"))
            return redirect(url_for("main.dashboard"))
        flash("Invalid username or password.", "error")

    return render_template("auth/login.html", form=form)


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You’ve been logged out.", "info")
    return redirect(url_for("main.index"))
