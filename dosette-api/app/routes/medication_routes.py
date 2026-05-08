from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.extensions import mongo
from app.middleware.auth import roles_required

medications_bp = Blueprint("medications", __name__)


# GET /medications (with search + pagination)
@medications_bp.get("")
@roles_required("admin", "pharmacist")
def list_medications():
    search = request.args.get("search")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    query = {}

    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    skip = (page - 1) * limit

    meds_cursor = mongo.db.medications.find(query).skip(skip).limit(limit)

    medications = []
    for med in meds_cursor:
        med["_id"] = str(med["_id"])
        medications.append(med)

    total = mongo.db.medications.count_documents(query)

    return jsonify({
        "data": medications,
        "page": page,
        "limit": limit,
        "total": total
    }), 200


# POST /medications
@medications_bp.post("")
@roles_required("admin", "pharmacist")
def create_medication():
    body = request.get_json() or {}

    required_fields = [
        "name",
        "strength",
        "form",
        "batch_number",
        "stock_quantity",
        "expiry_date",
        "price_per_unit",
        "low_stock_threshold"
    ]

    if not all(field in body for field in required_fields):
        return jsonify({"error": {"message": "All required fields must be provided"}}), 400

    try:
        stock_quantity = int(body["stock_quantity"])
        price_per_unit = float(body["price_per_unit"])
        low_stock_threshold = int(body["low_stock_threshold"])
    except (ValueError, TypeError):
        return jsonify({
            "error": {
                "message": "stock_quantity, price_per_unit and low_stock_threshold must be numeric"
            }
        }), 400

    medication = {
        "name": body["name"],
        "strength": body["strength"],
        "form": body["form"],
        "batch_number": body["batch_number"],
        "stock_quantity": stock_quantity,
        "expiry_date": body["expiry_date"],
        "price_per_unit": price_per_unit,
        "low_stock_threshold": low_stock_threshold,
        "created_at": datetime.utcnow()
    }

    result = mongo.db.medications.insert_one(medication)

    return jsonify({
        "message": "Medication created successfully",
        "medication_id": str(result.inserted_id)
    }), 201


# GET /medications/<id>
@medications_bp.get("/<id>")
@roles_required("admin", "pharmacist")
def get_medication(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    med = mongo.db.medications.find_one({"_id": oid})

    if not med:
        return jsonify({"error": {"message": "Medication not found"}}), 404

    med["_id"] = str(med["_id"])
    return jsonify({"data": med}), 200


# PUT /medications/<id>
@medications_bp.put("/<id>")
@roles_required("admin", "pharmacist")
def update_medication(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    body = request.get_json() or {}
    update_data = {}

    if "name" in body:
        update_data["name"] = body["name"]

    if "strength" in body:
        update_data["strength"] = body["strength"]

    if "form" in body:
        update_data["form"] = body["form"]

    if "batch_number" in body:
        update_data["batch_number"] = body["batch_number"]

    if "expiry_date" in body:
        update_data["expiry_date"] = body["expiry_date"]

    if "stock_quantity" in body:
        try:
            update_data["stock_quantity"] = int(body["stock_quantity"])
        except (ValueError, TypeError):
            return jsonify({"error": {"message": "stock_quantity must be numeric"}}), 400

    if "price_per_unit" in body:
        try:
            update_data["price_per_unit"] = float(body["price_per_unit"])
        except (ValueError, TypeError):
            return jsonify({"error": {"message": "price_per_unit must be numeric"}}), 400

    if "low_stock_threshold" in body:
        try:
            update_data["low_stock_threshold"] = int(body["low_stock_threshold"])
        except (ValueError, TypeError):
            return jsonify({"error": {"message": "low_stock_threshold must be numeric"}}), 400

    if not update_data:
        return jsonify({"error": {"message": "No valid fields provided"}}), 400

    update_data["updated_at"] = datetime.utcnow()

    result = mongo.db.medications.update_one({"_id": oid}, {"$set": update_data})

    if result.matched_count == 0:
        return jsonify({"error": {"message": "Medication not found"}}), 404

    return jsonify({"message": "Medication updated successfully"}), 200


# DELETE /medications/<id>
@medications_bp.delete("/<id>")
@roles_required("admin", "pharmacist")
def delete_medication(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    result = mongo.db.medications.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return jsonify({"error": {"message": "Medication not found"}}), 404

    return jsonify({"message": "Medication deleted successfully"}), 200