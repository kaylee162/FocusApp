from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import date, datetime
from zoneinfo import ZoneInfo

from extensions import db
from models.goal import Goal, GoalCompletion
from models.priority import PriorityGoal

priority_bp = Blueprint("priority", __name__)
EASTERN = ZoneInfo("America/New_York")


def today_eastern():
    return datetime.now(EASTERN).date()


@priority_bp.route("/priority/add", methods=["POST"])
@login_required
def add_priority():
    data = request.get_json() or {}
    goal_id = data.get("goal_id")

    if not goal_id:
        return jsonify({"success": False, "error": "Missing goal_id"}), 400

    goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"success": False, "error": "Goal not found"}), 404

    existing = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal_id,
        date=today_eastern()
    ).first()

    if not existing:
        priority = PriorityGoal(user_id=current_user.id, goal_id=goal_id, date=today_eastern())
        db.session.add(priority)
        db.session.commit()

    return jsonify({"success": True})


@priority_bp.route("/priority/complete", methods=["POST"])
@login_required
def complete_priority():
    data = request.get_json() or {}
    goal_id = data.get("goal_id")

    if not goal_id:
        return jsonify({"success": False, "error": "Missing goal_id"}), 400

    goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"success": False, "error": "Goal not found"}), 404

    today = today_eastern()
    goal.is_completed = True

    existing_completion = GoalCompletion.query.filter_by(
        user_id=current_user.id,
        goal_id=goal.id,
        completed_on=today
    ).first()

    if not existing_completion:
        db.session.add(GoalCompletion(
            user_id=current_user.id,
            goal_id=goal.id,
            completed_on=today,
            completed_at=datetime.now(EASTERN)
        ))

    priority = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal_id,
        date=today
    ).first()
    if priority:
        db.session.delete(priority)

    db.session.commit()

    return jsonify({
        "success": True,
        "goal_id": goal_id,
        "title": goal.title,
        "message": "Goal marked complete and removed from priorities."
    })


@priority_bp.route("/priority/remove", methods=["POST"])
@login_required
def remove_priority():
    data = request.get_json() or {}
    goal_id = data.get("goal_id")
    if not goal_id:
        return jsonify({"success": False, "error": "goal_id required"}), 400

    row = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal_id,
        date=today_eastern()
    ).first()

    if row:
        db.session.delete(row)
        db.session.commit()

    return jsonify({"success": True})
