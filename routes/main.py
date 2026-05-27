from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo

from extensions import db
from forms.goal_forms import GoalForm
from models.goal import Goal, GoalCompletion
from models.task import Task
from models.priority import PriorityGoal

main_bp = Blueprint("main", __name__)
EASTERN = ZoneInfo("America/New_York")


def today_eastern():
    return datetime.now(EASTERN).date()


def record_goal_completion(goal, completed_on=None):
    """Store one completion row per goal per day so charts survive daily resets."""
    completed_on = completed_on or today_eastern()

    existing = GoalCompletion.query.filter_by(
        user_id=goal.user_id,
        goal_id=goal.id,
        completed_on=completed_on
    ).first()

    if existing:
        return existing

    completion = GoalCompletion(
        user_id=goal.user_id,
        goal_id=goal.id,
        completed_on=completed_on,
        completed_at=datetime.now(EASTERN)
    )
    db.session.add(completion)
    return completion


@main_bp.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    return render_template("index.html")


@main_bp.route("/dashboard", methods=["GET", "POST"])
@login_required
def dashboard():
    if not current_user.onboarding_complete:
        return redirect(url_for("auth.onboarding"))

    form = GoalForm()
    reset_goals_if_needed()

    today = today_eastern()
    weekday_name = today.strftime("%A")
    day_of_month = today.day

    # Handle adding a new goal before building the dashboard lists.
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

    all_goals = Goal.query.filter_by(user_id=current_user.id).all()

    today_goals_all = []
    for goal in all_goals:
        if goal.repeat_type in ["none", "daily"]:
            today_goals_all.append(goal)
        elif goal.repeat_type == "weekly":
            if goal.target_day and goal.target_day.lower() == weekday_name.lower():
                today_goals_all.append(goal)
        elif goal.repeat_type == "monthly" and goal.target_day:
            try:
                goal_day = int(goal.target_day.split("-")[-1])
            except ValueError:
                goal_day = int(goal.target_day)
            if goal_day == day_of_month:
                today_goals_all.append(goal)

    completed_goal_ids_today = {
        row.goal_id for row in GoalCompletion.query.filter_by(
            user_id=current_user.id,
            completed_on=today
        ).all()
    }

    # Backfill today's completion rows from the older is_completed flag.
    for goal in today_goals_all:
        if goal.is_completed and goal.id not in completed_goal_ids_today:
            record_goal_completion(goal, today)
            completed_goal_ids_today.add(goal.id)
    db.session.commit()

    total_today = len(today_goals_all)
    completed_goals_today = [g for g in today_goals_all if g.id in completed_goal_ids_today or g.is_completed]
    completed_today = len(completed_goals_today)
    percent_today = (completed_today / total_today * 100) if total_today > 0 else 0

    today_goals_uncompleted = [g for g in today_goals_all if g.id not in completed_goal_ids_today and not g.is_completed]

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
            next_month = today.month + 1 if today.month < 12 else 1
            next_year = today.year if today.month < 12 else today.year + 1
            return datetime(next_year, next_month, min(goal_day, 28)).date()
        return today

    all_goals_sorted = sorted(all_goals, key=next_due_date)

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

    return render_template(
        "dashboard.html",
        user=current_user,
        form=form,
        goals=today_goals_uncompleted,
        all_goals=all_goals_sorted,
        total_today=total_today,
        completed_today=completed_today,
        completed_goals_today=completed_goals_today,
        percent_today=percent_today,
        tasks=today_tasks,
        priorities=priority_goals
    )


@main_bp.route("/goal/<int:goal_id>/complete")
@login_required
def complete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)

    if goal.user_id != current_user.id:
        flash("You don’t have permission to modify this goal.", "danger")
        return redirect(url_for("main.dashboard"))

    goal.is_completed = True
    record_goal_completion(goal)

    priority = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal.id,
        date=today_eastern()
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
    today = today_eastern()
    now = datetime.now(EASTERN)
    goals = Goal.query.all()

    for goal in goals:
        last_reset_date = goal.last_reset.date() if goal.last_reset else None
        if last_reset_date == today:
            continue

        if goal.repeat_type == "daily":
            goal.is_completed = False
            goal.last_reset = now
        elif goal.repeat_type == "weekly":
            if goal.target_day and goal.target_day.lower() == today.strftime("%A").lower():
                goal.is_completed = False
                goal.last_reset = now
        elif goal.repeat_type == "monthly":
            try:
                if goal.target_day and int(goal.target_day.split("-")[-1]) == today.day:
                    goal.is_completed = False
                    goal.last_reset = now
            except ValueError:
                pass

    db.session.commit()


@main_bp.route("/api/progress_data")
@login_required
def progress_data():
    requested_start = request.args.get("week_start")

    if requested_start:
        try:
            week_start = datetime.strptime(requested_start, "%Y-%m-%d").date()
        except ValueError:
            week_start = today_eastern() - timedelta(days=today_eastern().weekday())
    else:
        today = today_eastern()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    rows = GoalCompletion.query.filter(
        GoalCompletion.user_id == current_user.id,
        GoalCompletion.completed_on >= week_start,
        GoalCompletion.completed_on <= week_end
    ).all()

    counted = set()
    counts_by_day = {}
    for row in rows:
        counted.add((row.completed_on, row.goal_id))
        counts_by_day[row.completed_on] = counts_by_day.get(row.completed_on, 0) + 1

    # Gentle fallback for older data created before completion history existed.
    # Daily habits reset the next morning, so old daily completions may not be recoverable,
    # but this preserves older one-time/non-reset completions where updated_at still points to the completion day.
    legacy_completed_goals = Goal.query.filter(
        Goal.user_id == current_user.id,
        Goal.is_completed == True,
        Goal.updated_at >= datetime.combine(week_start, datetime.min.time()),
        Goal.updated_at < datetime.combine(week_end + timedelta(days=1), datetime.min.time())
    ).all()

    for goal in legacy_completed_goals:
        completed_day = goal.updated_at.date()
        key = (completed_day, goal.id)
        if key not in counted:
            counted.add(key)
            counts_by_day[completed_day] = counts_by_day.get(completed_day, 0) + 1

    data = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        data.append({
            "date": day.strftime("%a"),
            "full_date": day.isoformat(),
            "count": counts_by_day.get(day, 0)
        })

    return jsonify({
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "label": f"{week_start.strftime('%b')} {week_start.day} - {week_end.strftime('%b')} {week_end.day}",
        "data": data
    })
