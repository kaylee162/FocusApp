from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.priority import PriorityGoal
from extensions import db
from datetime import date

priority_bp = Blueprint("priority", __name__)

# Add a goal to today's priorities
@priority_bp.route("/priority/add", methods=["POST"])
@login_required
def add_priority():
    data = request.get_json()
    goal_id = data.get("goal_id")

    # prevent duplicates
    existing = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal_id,
        date=date.today()
    ).first()

    if not existing:
        p = PriorityGoal(user_id=current_user.id, goal_id=goal_id)
        db.session.add(p)
        db.session.commit()

    return jsonify({"success": True})

# Mark a priority goal as completed and remove from today's priorities
@priority_bp.route("/priority/complete", methods=["POST"])
@login_required
def complete_priority():
    data = request.get_json() or {}
    goal_id = data.get("goal_id")

    if not goal_id:
        return jsonify({"success": False, "error": "Missing goal_id"}), 400

    from models.goal import Goal
    from models.priority import PriorityGoal
    from datetime import date

    goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({"success": False, "error": "Goal not found"}), 404

    goal.is_completed = True

    # Remove from today's priorities if exists
    priority = PriorityGoal.query.filter_by(
        user_id=current_user.id,
        goal_id=goal_id,
        date=date.today()
    ).first()
    if priority:
        db.session.delete(priority)

    db.session.commit()

    return jsonify({
        "success": True,
        "goal_id": goal_id,
        "message": "Goal marked complete and removed from priorities."
    })



# Remove a goal from today's priorities without completing it
@priority_bp.route("/priority/remove", methods=["POST"])
@login_required
def remove_priority():
    data = request.get_json()
    goal_id = data.get("goal_id")
    if not goal_id:
        return jsonify({"success": False, "error": "goal_id required"}), 400

    row = PriorityGoal.query.filter_by(
        user_id=current_user.id, goal_id=goal_id, date=date.today()
    ).first()

    if row:
        db.session.delete(row)
        db.session.commit()

    return jsonify({"success": True})
