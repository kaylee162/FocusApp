from flask import Flask
from dotenv import load_dotenv
import os
from extensions import db, login_manager
from flask_migrate import Migrate

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

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)

    # --- Database setup ---
    with app.app_context():
        from models.user import User
        from models.goal import Goal
        db.create_all()

    return app


# --- Run the app ---
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
