from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.extensions import mongo
from app.middleware.auth import roles_required

cycles_bp = Blueprint("cycles", __name__)

VALID_STATUSES = ["pending", "prepared", "collected", "delivered"]


def add_medication_details_to_tray(tray):
    """
    Adds medication_name, strength and stock_quantity to each medication item
    inside tray_structure so the response is easier to read.
    """
    for day, slots in tray.items():
        for slot, meds in slots.items():
            for med in meds:
                try:
                    med_doc = mongo.db.medications.find_one(
                        {"_id": ObjectId(med["medication_id"])}
                    )

                    if med_doc:
                        med["medication_name"] = med_doc.get("name", "Unknown Medication")
                        med["strength"] = med_doc.get("strength", "Unknown Strength")
                        med["stock_quantity"] = med_doc.get("stock_quantity", 0)
                    else:
                        med["medication_name"] = "Unknown Medication"
                        med["strength"] = "Unknown Strength"
                        med["stock_quantity"] = 0

                except Exception:
                    med["medication_name"] = "Unknown Medication"
                    med["strength"] = "Unknown Strength"
                    med["stock_quantity"] = 0

    return tray


def add_patient_details(cycle):
    """
    Adds safe patient display fields to cycle response.
    This lets dispenser see picking list names without accessing /patients.
    """
    try:
        patient = mongo.db.patients.find_one({"_id": cycle["patient_id"]})

        if patient:
            cycle["patient_name"] = patient.get("name", "Unknown Patient")
        else:
            cycle["patient_name"] = "Unknown Patient"

    except Exception:
        cycle["patient_name"] = "Unknown Patient"

    return cycle


# POST /cycles
@cycles_bp.post("")
@roles_required("admin", "pharmacist")
def create_cycle():
    body = request.get_json() or {}

    patient_id = body.get("patient_id")
    week_start = body.get("week_start")
    week_end = body.get("week_end")
    status = body.get("status", "pending")
    tray_structure = body.get("tray_structure", {})

    if not patient_id or not week_start or not week_end:
        return jsonify({
            "error": {
                "message": "patient_id, week_start and week_end are required"
            }
        }), 400

    if status not in VALID_STATUSES:
        return jsonify({
            "error": {
                "message": "Invalid status"
            }
        }), 400

    try:
        patient_oid = ObjectId(patient_id)
        prepared_by_oid = ObjectId(request.user["user_id"])
    except InvalidId:
        return jsonify({
            "error": {
                "message": "Invalid patient_id or user_id format"
            }
        }), 400

    patient = mongo.db.patients.find_one({"_id": patient_oid})
    if not patient:
        return jsonify({
            "error": {
                "message": "Patient not found"
            }
        }), 404

    cycle = {
        "patient_id": patient_oid,
        "week_start": week_start,
        "week_end": week_end,
        "status": status,
        "tray_structure": tray_structure,
        "prepared_by": prepared_by_oid,
        "created_at": datetime.utcnow()
    }

    result = mongo.db.cycles.insert_one(cycle)

    return jsonify({
        "message": "Cycle created successfully",
        "cycle_id": str(result.inserted_id)
    }), 201


# GET /cycles
@cycles_bp.get("")
@roles_required("admin", "pharmacist", "dispenser")
def list_cycles():
    patient_id = request.args.get("patient_id")
    status = request.args.get("status")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    query = {}

    if patient_id:
        try:
            query["patient_id"] = ObjectId(patient_id)
        except InvalidId:
            return jsonify({"error": {"message": "Invalid patient_id format"}}), 400

    if status:
        query["status"] = status

    if from_date or to_date:
        query["week_start"] = {}
        if from_date:
            query["week_start"]["$gte"] = from_date
        if to_date:
            query["week_start"]["$lte"] = to_date

    skip = (page - 1) * limit

    cycles_cursor = mongo.db.cycles.find(query).skip(skip).limit(limit)

    cycles = []
    for cycle in cycles_cursor:
        cycle = add_patient_details(cycle)

        cycle["_id"] = str(cycle["_id"])
        cycle["patient_id"] = str(cycle["patient_id"])
        cycle["prepared_by"] = str(cycle["prepared_by"])

        tray = cycle.get("tray_structure", {})
        cycle["tray_structure"] = add_medication_details_to_tray(tray)

        cycles.append(cycle)

    total = mongo.db.cycles.count_documents(query)

    return jsonify({
        "data": cycles,
        "page": page,
        "limit": limit,
        "total": total
    }), 200


# GET /cycles/<id>
@cycles_bp.get("/<id>")
@roles_required("admin", "pharmacist", "dispenser")
def get_cycle(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    cycle = mongo.db.cycles.find_one({"_id": oid})

    if not cycle:
        return jsonify({"error": {"message": "Cycle not found"}}), 404

    cycle = add_patient_details(cycle)

    cycle["_id"] = str(cycle["_id"])
    cycle["patient_id"] = str(cycle["patient_id"])
    cycle["prepared_by"] = str(cycle["prepared_by"])

    tray = cycle.get("tray_structure", {})
    cycle["tray_structure"] = add_medication_details_to_tray(tray)

    return jsonify({"data": cycle}), 200


# PUT /cycles/<id>
@cycles_bp.put("/<id>")
@roles_required("admin", "pharmacist")
def update_cycle(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    body = request.get_json() or {}
    update_data = {}

    if "week_start" in body:
        update_data["week_start"] = body["week_start"]

    if "week_end" in body:
        update_data["week_end"] = body["week_end"]

    if "status" in body:
        if body["status"] not in VALID_STATUSES:
            return jsonify({"error": {"message": "Invalid status"}}), 400
        update_data["status"] = body["status"]

    if "tray_structure" in body:
        update_data["tray_structure"] = body["tray_structure"]

    if not update_data:
        return jsonify({"error": {"message": "No valid fields provided"}}), 400

    update_data["updated_at"] = datetime.utcnow()

    result = mongo.db.cycles.update_one({"_id": oid}, {"$set": update_data})

    if result.matched_count == 0:
        return jsonify({"error": {"message": "Cycle not found"}}), 404

    return jsonify({"message": "Cycle updated successfully"}), 200


# PUT /cycles/<id>/status
@cycles_bp.put("/<id>/status")
@roles_required("admin", "pharmacist")
def update_cycle_status(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    body = request.get_json() or {}
    status = body.get("status")

    if status not in VALID_STATUSES:
        return jsonify({"error": {"message": "Invalid status"}}), 400

    result = mongo.db.cycles.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": {"message": "Cycle not found"}}), 404

    return jsonify({"message": "Cycle status updated successfully"}), 200


# DELETE /cycles/<id>
@cycles_bp.delete("/<id>")
@roles_required("admin", "pharmacist")
def delete_cycle(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    result = mongo.db.cycles.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return jsonify({"error": {"message": "Cycle not found"}}), 404

    return jsonify({"message": "Cycle deleted successfully"}), 200