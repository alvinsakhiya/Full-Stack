from flask import Blueprint, jsonify, request
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.extensions import mongo
from app.middleware.auth import roles_required

picking_bp = Blueprint("picking", __name__)


def build_picking_items_from_cycle(cycle):
    tray_structure = cycle.get("tray_structure", {})
    medication_totals = {}

    for day_data in tray_structure.values():
        for slot_items in day_data.values():
            for item in slot_items:
                medication_id = item.get("medication_id")
                quantity = item.get("quantity", 0)

                if medication_id not in medication_totals:
                    medication_totals[medication_id] = 0

                medication_totals[medication_id] += quantity

    items = []
    for medication_id, total_quantity in medication_totals.items():
        try:
            med = mongo.db.medications.find_one({"_id": ObjectId(medication_id)})
        except InvalidId:
            med = None

        items.append({
            "medication_id": medication_id,
            "medication_name": med.get("name", "Unknown Medication") if med else "Unknown Medication",
            "strength": med.get("strength", "Unknown Strength") if med else "Unknown Strength",
            "form": med.get("form", "Unknown Form") if med else "Unknown Form",
            "total_quantity": total_quantity
        })

    items.sort(key=lambda x: x["medication_name"])
    return items


@picking_bp.post("/generate/<cycle_id>")
@roles_required("admin", "pharmacist", "dispenser")
def generate_picking_list(cycle_id):
    try:
        cycle_oid = ObjectId(cycle_id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid cycle ID format"}}), 400

    cycle = mongo.db.cycles.find_one({"_id": cycle_oid})
    if not cycle:
        return jsonify({"error": {"message": "Cycle not found"}}), 404

    items = build_picking_items_from_cycle(cycle)

    picking_list = {
        "cycle_id": cycle_oid,
        "items": items,
        "generated_at": datetime.utcnow()
    }

    result = mongo.db.picking_lists.insert_one(picking_list)

    return jsonify({
        "message": "Picking list generated successfully",
        "picking_list_id": str(result.inserted_id),
        "items": items
    }), 201


@picking_bp.get("/<id>")
@roles_required("admin", "pharmacist", "dispenser")
def get_picking_list(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    picking_list = mongo.db.picking_lists.find_one({"_id": oid})
    if not picking_list:
        return jsonify({"error": {"message": "Picking list not found"}}), 404

    picking_list["_id"] = str(picking_list["_id"])
    picking_list["cycle_id"] = str(picking_list["cycle_id"])

    return jsonify({"data": picking_list}), 200


@picking_bp.get("")
@roles_required("admin", "pharmacist", "dispenser")
def list_picking_lists():
    cycle_id = request.args.get("cycle_id")
    query = {}

    if cycle_id:
        try:
            query["cycle_id"] = ObjectId(cycle_id)
        except InvalidId:
            return jsonify({"error": {"message": "Invalid cycle_id format"}}), 400

    picking_lists = []

    for picking_list in mongo.db.picking_lists.find(query):
        picking_list["_id"] = str(picking_list["_id"])
        picking_list["cycle_id"] = str(picking_list["cycle_id"])
        picking_lists.append(picking_list)

    return jsonify({"data": picking_lists}), 200


@picking_bp.delete("/<id>")
@roles_required("admin", "pharmacist", "dispenser")
def delete_picking_list(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"error": {"message": "Invalid ID format"}}), 400

    result = mongo.db.picking_lists.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return jsonify({"error": {"message": "Picking list not found"}}), 404

    return jsonify({"message": "Picking list deleted successfully"}), 200