from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from .config import Config
from .extensions import mongo
from flask_cors import CORS

def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)

    mongo.init_app(app)
    CORS(app)

    # Import and register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.patient_routes import patients_bp
    from .routes.guest_routes import guest_bp
    from .routes.admin_routes import admin_bp
    from .routes.medication_routes import medications_bp
    from .routes.cycle_routes import cycles_bp
    from .routes.picking_routes import picking_bp
    from .routes.report_routes import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(patients_bp, url_prefix="/patients")
    app.register_blueprint(guest_bp, url_prefix="/guest")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(medications_bp, url_prefix="/medications")
    app.register_blueprint(cycles_bp, url_prefix="/cycles")
    app.register_blueprint(picking_bp, url_prefix="/picking-lists")
    app.register_blueprint(reports_bp, url_prefix="/reports")

    @app.get("/")
    def home():
        return {"message": "Dosette API running"}

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": {"message": "Route not found"}}), 404

    return app