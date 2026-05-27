from flask import Flask
from dotenv import load_dotenv
import os
from extensions import db, login_manager
from flask_migrate import Migrate
from sqlalchemy import text

def create_app():
    load_dotenv()
    app = Flask(__name__, instance_relative_config=True)

    # --- Configuration ---
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///focus.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # --- Initialize extensions ---
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    migrate = Migrate(app, db)
    
    # --- Register blueprints ---
    from routes.main import main_bp
    from routes.auth import auth_bp
    from routes.tasks import tasks_bp
    from routes.priority import priority_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(priority_bp)

    # --- Database setup ---
    with app.app_context():
        from models.user import User
        from models.goal import Goal, GoalCompletion
        from models.task import Task 
        from models.priority import PriorityGoal
        db.create_all()
        ensure_user_onboarding_columns()

    return app


def ensure_user_onboarding_columns():
    # db.create_all() creates new tables, but it does not add columns to an existing SQLite table.
    # This keeps local development simple for this project without forcing a manual migration.
    inspector_rows = db.session.execute(text("PRAGMA table_info(user)")).fetchall()
    existing_columns = {row[1] for row in inspector_rows}

    columns_to_add = {
        "sidekick_name": "ALTER TABLE user ADD COLUMN sidekick_name VARCHAR(24)",
        "sidekick_character": "ALTER TABLE user ADD COLUMN sidekick_character VARCHAR(20)",
        "habit_categories": "ALTER TABLE user ADD COLUMN habit_categories VARCHAR(255)",
        "onboarding_complete": "ALTER TABLE user ADD COLUMN onboarding_complete BOOLEAN NOT NULL DEFAULT 0",
    }

    for column_name, statement in columns_to_add.items():
        if column_name not in existing_columns:
            db.session.execute(text(statement))

    db.session.commit()


# --- Create app for Vercel / production ---
app = create_app()

# --- Run locally ---
if __name__ == "__main__":
    app.run(debug=True)