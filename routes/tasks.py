from flask import Blueprint, render_template, request, redirect, jsonify
from flask_login import login_required, current_user
from models.task import Task
from extensions import db
from datetime import date

tasks_bp = Blueprint("tasks", __name__)

@tasks_bp.route("/tasks", methods=["GET"])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id, date=date.today()).all()
    return render_template("tasks.html", tasks=tasks)

@tasks_bp.route("/tasks/add", methods=["POST"])
@login_required
def add_task():
    title = request.form.get("title")
    if title:
        new_task = Task(user_id=current_user.id, title=title)
        db.session.add(new_task)
        db.session.commit()
    return redirect("/dashboard")

@tasks_bp.route("/tasks/update/<int:task_id>", methods=["POST"])
@login_required
def update_task(task_id):
    task = Task.query.get(task_id)
    if task and task.user_id == current_user.id:
        task.completed = not task.completed
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False}), 403

@tasks_bp.route("/tasks/reorder", methods=["POST"])
@login_required
def reorder_tasks():
    data = request.get_json()
    if not data:
        return jsonify({"success": False}), 400
    return jsonify({"success": True})
