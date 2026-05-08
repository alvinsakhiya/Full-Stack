from flask import Blueprint, request, jsonify
from datetime import datetime
import bcrypt
from app.extensions import mongo
from app.middleware.auth import create_token, jwt_required, get_current_user_doc

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    role = (body.get("role") or "dispenser").strip().lower()

    if role not in ["admin", "pharmacist", "dispenser"]:
        return jsonify({"error": {"message": "Invalid role"}}), 400

    if not email or not password:
        return jsonify({"error": {"message": "email and password are required"}}), 400

    existing = mongo.db.users.find_one({"email": email})
    if existing:
        return jsonify({"error": {"message": "Email already registered"}}), 409

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user_doc = {
        "email": email,
        "password": hashed,
        "role": role,
        "created_at": datetime.utcnow()
    }

    result = mongo.db.users.insert_one(user_doc)

    return jsonify({
        "message": "User registered",
        "user_id": str(result.inserted_id),
        "role": role
    }), 201


@auth_bp.get("/check-email")
def check_email():
    email = (request.args.get("email") or "").strip().lower()

    if not email:
        return jsonify({
            "available": False,
            "message": "Email is required"
        }), 400

    existing = mongo.db.users.find_one({"email": email})

    return jsonify({
        "available": existing is None,
        "message": "Email is available" if existing is None else "Email already registered"
    }), 200


@auth_bp.post("/login")
def login():
    body = request.get_json() or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": {"message": "email and password are required"}}), 400

    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": {"message": "Invalid credentials"}}), 401

    stored_hash = user.get("password")
    if not stored_hash or not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
        return jsonify({"error": {"message": "Invalid credentials"}}), 401

    token = create_token(str(user["_id"]), user.get("role", "dispenser"))

    return jsonify({
        "message": "Login successful",
        "token": token,
        "role": user.get("role", "dispenser")
    }), 200


@auth_bp.post("/auth0-login")
def auth0_login():
    body = request.get_json() or {}

    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()
    avatar = (body.get("avatar") or "").strip()

    if not email:
        return jsonify({"error": {"message": "Email is required"}}), 400

    user = mongo.db.users.find_one({"email": email})

    if not user:
        user_doc = {
            "email": email,
            "name": name or email.split("@")[0],
            "avatar": avatar,
            "role": "dispenser",
            "auth_provider": "auth0_google",
            "created_at": datetime.utcnow()
        }

        result = mongo.db.users.insert_one(user_doc)
        user = mongo.db.users.find_one({"_id": result.inserted_id})
    else:
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "name": name or user.get("name", email.split("@")[0]),
                    "avatar": avatar or user.get("avatar", ""),
                    "last_login_at": datetime.utcnow()
                }
            }
        )
        user = mongo.db.users.find_one({"_id": user["_id"]})

    token = create_token(str(user["_id"]), user.get("role", "dispenser"))

    return jsonify({
        "message": "Google login successful",
        "token": token,
        "role": user.get("role", "dispenser"),
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "name": user.get("name", "User"),
            "avatar": user.get("avatar", "")
        }
    }), 200


@auth_bp.get("/me")
@jwt_required
def me():
    user = get_current_user_doc()
    if not user:
        return jsonify({"error": {"message": "User not found"}}), 404

    return jsonify({"data": user}), 200


@auth_bp.post("/logout")
@jwt_required
def logout():
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return jsonify({"error": {"message": "Missing or invalid authorization header"}}), 401

    token = auth_header.split(" ", 1)[1].strip()

    existing = mongo.db.blacklisted_tokens.find_one({"token": token})
    if existing:
        return jsonify({"message": "Token already blacklisted"}), 200

    mongo.db.blacklisted_tokens.insert_one({
        "token": token,
        "blacklisted_at": datetime.utcnow()
    })

    return jsonify({
        "message": "Logged out successfully. Token blacklisted."
    }), 200
