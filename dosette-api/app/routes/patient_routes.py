from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from app.extensions import mongo
from bson import ObjectId
from bson.errors import InvalidId
from app.middleware.auth import roles_required

patients_bp = Blueprint("patients", __name__)


# GET /patients
@patients_bp.get("")
@roles_required("admin", "pharmacist")
def list_patients():
    search = request.args.get("search")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    query = {}

    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    skip = (page - 1) * limit

    patients_cursor = mongo.db.patients.find(query).skip(skip).limit(limit)

    patients = []
    for patient in patients_cursor:
        patient["_id"] = str(patient["_id"])
        patients.append(patient)

    total = mongo.db.patients.count_documents(query)

    return jsonify({
        "data": patients,
        "page": page,
        "limit": limit,
        "total": total
    }), 200


# POST /patients
@patients_bp.post("")
@roles_required("admin", "pharmacist")
def create_patient():
    body = request.get_json()

    if not body:
        return jsonify({"error": {"message": "Request body is required"}}), 400

    name = body.get("name")
    dob = body.get("date_of_birth")

    if not name or not dob:
        return jsonify({"error": {"message": "name and date_of_birth are required"}}), 400

    patient = {
        "name": name,
        "date_of_birth": dob,
        "phone": body.get("phone"),
        "allergies": body.get("allergies", []),
        "notes": body.get("notes"),
        "created_at": datetime.utcnow()
    }

    result = mongo.db.patients.insert_one(patient)

    return jsonify({
        "message": "Patient created successfully",
        "patient_id": str(result.inserted_id)
    }), 201


# GET /patients/<id>
@patients_bp.get("/<id>")
@roles_required("admin", "pharmacist")
def get_patient(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format (must be 24-char ObjectId)"}}), 400

    patient = mongo.db.patients.find_one({"_id": oid})
    if not patient:
        return jsonify({"error": {"message": "Patient not found"}}), 404

    patient["_id"] = str(patient["_id"])
    return jsonify({"data": patient}), 200


# DELETE /patients/<id>
@patients_bp.delete("/<id>")
@roles_required("admin", "pharmacist")
def delete_patient(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format (must be 24-char ObjectId)"}}), 400

    result = mongo.db.patients.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": {"message": "Patient not found"}}), 404

    return jsonify({"message": "Patient deleted successfully"}), 200

@patients_bp.put("/<id>")
@roles_required("admin", "pharmacist")
def update_patient(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format (must be 24-char ObjectId)"}}), 400

    body = request.get_json() or {}
    update_data = {}

    for field in ["name", "date_of_birth", "phone", "allergies", "notes"]:
        if field in body:
            update_data[field] = body[field]

    if not update_data:
        return jsonify({"error": {"message": "No valid fields provided to update"}}), 400

    update_data["updated_at"] = datetime.utcnow()

    result = mongo.db.patients.update_one({"_id": oid}, {"$set": update_data})

    if result.matched_count == 0:
        return jsonify({"error": {"message": "Patient not found"}}), 404

    return jsonify({"message": "Patient updated successfully"}), 200