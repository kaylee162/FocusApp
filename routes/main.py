from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from extensions import db
from models.goal import Goal
from forms.goal_forms import GoalForm

main_bp = Blueprint("main", __name__)

from flask_login import current_user, login_required
from flask import redirect, url_for, render_template
from datetime import datetime, timedelta
from flask import render_template, redirect, url_for, flash

@main_bp.route("/")
def index():
    # If the user is logged in, take them straight to their dashboard
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    # Otherwise, show the welcome landing page
    return render_template("index.html")

@main_bp.route("/dashboard", methods=["GET", "POST"])
@login_required
def dashboard():
    form = GoalForm()
    reset_goals_if_needed()

    # Load all goals for this user
    all_goals = Goal.query.filter_by(user_id=current_user.id).all()

    # Delete one-time completed goals
    for g in all_goals:
        if g.repeat_type == "none" and g.is_completed:
            db.session.delete(g)
    db.session.commit()

    today = datetime.utcnow().date()
    weekday_name = today.strftime("%A")
    day_of_month = today.day

    # --- Identify today's goals ---
    today_goals_all = []
    for g in all_goals:
        if g.repeat_type in ["none", "daily"]:
            today_goals_all.append(g)
        elif g.repeat_type == "weekly":
            if g.target_day and g.target_day.lower() == weekday_name.lower():
                today_goals_all.append(g)
        elif g.repeat_type == "monthly":
            if g.target_day:
                try:
                    goal_day = int(g.target_day.split("-")[-1])
                except ValueError:
                    goal_day = int(g.target_day)
                if goal_day == day_of_month:
                    today_goals_all.append(g)

    # --- Calculate today's progress ---
    total_today = len(today_goals_all)
    completed_today = len([g for g in today_goals_all if g.is_completed])
    percent_today = (completed_today / total_today * 100) if total_today > 0 else 0

    # --- Filter uncompleted goals for dashboard view ---
    today_goals_uncompleted = [g for g in today_goals_all if not g.is_completed]

    # --- Sort all goals for "Show All" ---
    def next_due_date(goal):
        """Estimate the next due date for sorting."""
        # Daily → today (always)
        if goal.repeat_type == "daily":
            return today
        # Weekly → next occurrence of the weekday
        if goal.repeat_type == "weekly" and goal.target_day:
            weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            today_idx = weekdays.index(weekday_name)
            target_idx = weekdays.index(goal.target_day)
            delta_days = (target_idx - today_idx) % 7
            return today + timedelta(days=delta_days)
        # Monthly → next date with that day number
        if goal.repeat_type == "monthly" and goal.target_day:
            try:
                goal_day = int(goal.target_day.split("-")[-1])
            except ValueError:
                goal_day = int(goal.target_day)
            # Same month if still ahead, else next month
            if goal_day >= day_of_month:
                return today.replace(day=goal_day)
            else:
                next_month = today.month + 1 if today.month < 12 else 1
                next_year = today.year if today.month < 12 else today.year + 1
                return datetime(next_year, next_month, min(goal_day, 28)).date()
        # One-time goals → assume no repeat
        return today

    # Sort: soonest due first
    all_goals_sorted = sorted(all_goals, key=next_due_date)

    # --- Handle adding a new goal ---
    if form.validate_on_submit():
        goal = Goal(
            user_id=current_user.id,
            title=form.title.data,
            description=form.description.data,
            category=form.category.data,
            repeat_type=form.repeat_type.data,
            target_day=form.target_day.data or None
        )
        db.session.add(goal)
        db.session.commit()
        flash("Goal added successfully!", "success")
        return redirect(url_for("main.dashboard"))

    return render_template(
        "dashboard.html",
        user=current_user,
        form=form,
        goals=today_goals_uncompleted,   # today's active ones
        all_goals=all_goals_sorted,      # sorted by next due date
        total_today=total_today,
        completed_today=completed_today,
        percent_today=percent_today
    )


@main_bp.route("/goal/<int:goal_id>/complete")
@login_required
def complete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    if goal.user_id != current_user.id:
        flash("You don’t have permission to modify this goal.", "danger")
        return redirect(url_for("main.dashboard"))
    goal.is_completed = True
    db.session.commit()
    flash("Goal marked as completed!", "info")
    return redirect(url_for("main.dashboard"))

@main_bp.route("/goal/<int:goal_id>/delete")
@login_required
def delete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    if goal.user_id != current_user.id:
        flash("You don’t have permission to delete this goal.", "danger")
        return redirect(url_for("main.dashboard"))
    db.session.delete(goal)
    db.session.commit()
    flash("Goal deleted.", "warning")
    return redirect(url_for("main.dashboard"))

def reset_goals_if_needed():
    today = datetime.utcnow().date()
    goals = Goal.query.all()

    for goal in goals:
        # Skip if already refreshed today
        if goal.last_reset == today:
            continue

        # Daily goals reset every day
        if goal.repeat_type == "daily":
            goal.is_completed = False
            goal.last_reset = today

        # Weekly goals reset on the target weekday
        elif goal.repeat_type == "weekly":
            if goal.target_day and goal.target_day.lower() == today.strftime("%A").lower():
                goal.is_completed = False
                goal.last_reset = today

        # Monthly goals reset on the target day of month
        elif goal.repeat_type == "monthly":
            if goal.target_day and goal.target_day.isdigit() and int(goal.target_day) == today.day:
                goal.is_completed = False
                goal.last_reset = today

    db.session.commit()
