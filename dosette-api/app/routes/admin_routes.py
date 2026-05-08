from flask import Blueprint, jsonify, request
from bson import ObjectId
from bson.errors import InvalidId
from app.extensions import mongo
from app.middleware.auth import roles_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/users")
@roles_required("admin")
def list_users():
    users = []
    for u in mongo.db.users.find({}, {"password": 0}):
        u["_id"] = str(u["_id"])
        users.append(u)
    return jsonify({"data": users}), 200


@admin_bp.put("/users/<id>/role")
@roles_required("admin")
def update_user_role(id):
    body = request.get_json() or {}
    role = (body.get("role") or "").strip().lower()

    if role not in ["admin", "pharmacist", "dispenser"]:
        return jsonify({"error": {"message": "Invalid role"}}), 400

    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    result = mongo.db.users.update_one({"_id": oid}, {"$set": {"role": role}})
    if result.matched_count == 0:
        return jsonify({"error": {"message": "User not found"}}), 404

    return jsonify({"message": "Role updated"}), 200


@admin_bp.delete("/users/<id>")
@roles_required("admin")
def delete_user(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    result = mongo.db.users.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": {"message": "User not found"}}), 404

    return jsonify({"message": "User deleted"}), 200