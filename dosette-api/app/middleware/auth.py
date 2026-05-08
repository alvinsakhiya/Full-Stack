from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from app.extensions import mongo


def create_token(user_id: str, role: str):
    payload = {
        "sub": user_id,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=current_app.config["JWT_EXPIRES_MINUTES"])
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def _get_bearer_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _get_bearer_token()
        if not token:
            return jsonify({"error": {"message": "Missing Bearer token"}}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config["JWT_SECRET"],
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": {"message": "Token expired"}}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": {"message": "Invalid token"}}), 401

        # Check if token is blacklisted
        blacklisted = mongo.db.blacklisted_tokens.find_one({"token": token})
        if blacklisted:
            return jsonify({"error": {"message": "Token has been revoked"}}), 401

        request.user = {
            "user_id": payload.get("sub"),
            "role": payload.get("role")
        }
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required
        def wrapper(*args, **kwargs):
            role = getattr(request, "user", {}).get("role")
            if role not in allowed_roles:
                return jsonify({"error": {"message": "Forbidden (insufficient role)"}}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user_doc():
    user_id = getattr(request, "user", {}).get("user_id")
    try:
        oid = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None

    user = mongo.db.users.find_one({"_id": oid}, {"password": 0})
    if not user:
        return None

    user["_id"] = str(user["_id"])
    return user