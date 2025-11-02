from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from extensions import db
from models.goal import Goal
from forms.goal_forms import GoalForm

main_bp = Blueprint("main", __name__)

from flask_login import current_user, login_required
from flask import redirect, url_for, render_template
from datetime import datetime, timedelta, date
from flask import render_template, redirect, url_for, flash
from models.task import Task
from models.priority import PriorityGoal
from flask import jsonify
from zoneinfo import ZoneInfo

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

    # --- Time setup (use Eastern Time)
    eastern = ZoneInfo("America/New_York")
    today = datetime.now(eastern).date()
    weekday_name = today.strftime("%A")
    day_of_month = today.day

    # --- Load all goals fresh from DB ---
    all_goals = Goal.query.filter_by(user_id=current_user.id).all()

    # --- Delete one-time completed goals ---
    for g in all_goals:
        if g.repeat_type == "none" and g.is_completed:
            db.session.delete(g)
    db.session.commit()

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

    # --- Show only active (not completed) goals in today's section ---
    today_goals_uncompleted = [g for g in today_goals_all if not g.is_completed]

    # --- Sort all goals by next due date ---
    def next_due_date(goal):
        if goal.repeat_type == "daily":
            return today
        if goal.repeat_type == "weekly" and goal.target_day:
            weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            today_idx = weekdays.index(weekday_name)
            target_idx = weekdays.index(goal.target_day)
            delta_days = (target_idx - today_idx) % 7
            return today + timedelta(days=delta_days)
        if goal.repeat_type == "monthly" and goal.target_day:
            try:
                goal_day = int(goal.target_day.split("-")[-1])
            except ValueError:
                goal_day = int(goal.target_day)
            if goal_day >= day_of_month:
                return today.replace(day=goal_day)
            else:
                next_month = today.month + 1 if today.month < 12 else 1
                next_year = today.year if today.month < 12 else today.year + 1
                return datetime(next_year, next_month, min(goal_day, 28)).date()
        return today

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

    # --- Load tasks and priorities ---
    today_tasks = Task.query.filter_by(user_id=current_user.id, date=today).all()
    priority_goals = (
        db.session.query(Goal)
        .join(PriorityGoal, PriorityGoal.goal_id == Goal.id)
        .filter(
            PriorityGoal.user_id == current_user.id,
            PriorityGoal.date == today
        )
        .all()
    )

    # --- Render the dashboard ---
    return render_template(
        "dashboard.html",
        user=current_user,
        form=form,
        goals=today_goals_uncompleted,
        all_goals=all_goals_sorted,
        total_today=total_today,
        completed_today=completed_today,
        percent_today=percent_today,
        tasks=today_tasks,
        priorities=priority_goals
    )



@main_bp.route("/goal/<int:goal_id>/complete")
@login_required
def complete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)

    # --- Permission check ---
    if goal.user_id != current_user.id:
        flash("You don’t have permission to modify this goal.", "danger")
        return redirect(url_for("main.dashboard"))

    # --- Mark as completed ---
    goal.is_completed = True

    # --- Also remove from today's priorities, if present ---
    from models.priority import PriorityGoal
    from datetime import date

    priority = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal.id,
        date=date.today()
    ).first()

    if priority:
        db.session.delete(priority)

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
    eastern = ZoneInfo("America/New_York")
    today = datetime.now(eastern).date()
    goals = Goal.query.all()

    for goal in goals:
        # Convert datetime to date safely if needed
        last_reset_date = (
            goal.last_reset.date() if goal.last_reset else None
        )

        # Skip if already reset today
        if last_reset_date == today:
            continue

        # --- Daily goals ---
        if goal.repeat_type == "daily":
            goal.is_completed = False
            goal.last_reset = datetime.now(eastern)

        # --- Weekly goals ---
        elif goal.repeat_type == "weekly":
            if goal.target_day and goal.target_day.lower() == today.strftime("%A").lower():
                goal.is_completed = False
                goal.last_reset = datetime.now(eastern)

        # --- Monthly goals ---
        elif goal.repeat_type == "monthly":
            try:
                if goal.target_day and int(goal.target_day) == today.day:
                    goal.is_completed = False
                    goal.last_reset = datetime.now(eastern)
            except ValueError:
                pass

    db.session.commit()

@main_bp.route("/api/progress_data")
@login_required
def progress_data():
    today = date.today()
    data = []

    for i in range(6, -1, -1):  # past 7 days
        day = today - timedelta(days=i)
        # Example rule: a goal counts if completed that day (is_completed True and created before/at day)
        count = Goal.query.filter(
            Goal.user_id == current_user.id,
            Goal.is_completed == True,
            Goal.updated_at >= day,
            Goal.updated_at < day + timedelta(days=1)
        ).count() if hasattr(Goal, "updated_at") else 0
        data.append({"date": day.strftime("%a"), "count": count})

    return jsonify(data)
