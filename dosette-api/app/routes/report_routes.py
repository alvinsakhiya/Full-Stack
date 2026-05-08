from flask import Blueprint, jsonify, request
from datetime import datetime
from app.extensions import mongo
from app.middleware.auth import jwt_required

reports_bp = Blueprint("reports", __name__)


# GET /reports/most-used-medications
@reports_bp.get("/most-used-medications")
@jwt_required
def most_used_medications():
    pipeline = [
        {
            "$project": {
                "all_slots": {
                    "$concatArrays": [
                        {"$ifNull": ["$tray_structure.monday.morning", []]},
                        {"$ifNull": ["$tray_structure.monday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.monday.evening", []]},
                        {"$ifNull": ["$tray_structure.tuesday.morning", []]},
                        {"$ifNull": ["$tray_structure.tuesday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.tuesday.evening", []]},
                        {"$ifNull": ["$tray_structure.wednesday.morning", []]},
                        {"$ifNull": ["$tray_structure.wednesday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.wednesday.evening", []]},
                        {"$ifNull": ["$tray_structure.thursday.morning", []]},
                        {"$ifNull": ["$tray_structure.thursday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.thursday.evening", []]},
                        {"$ifNull": ["$tray_structure.friday.morning", []]},
                        {"$ifNull": ["$tray_structure.friday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.friday.evening", []]},
                        {"$ifNull": ["$tray_structure.saturday.morning", []]},
                        {"$ifNull": ["$tray_structure.saturday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.saturday.evening", []]},
                        {"$ifNull": ["$tray_structure.sunday.morning", []]},
                        {"$ifNull": ["$tray_structure.sunday.afternoon", []]},
                        {"$ifNull": ["$tray_structure.sunday.evening", []]}
                    ]
                }
            }
        },
        {"$unwind": "$all_slots"},
        {
            "$group": {
                "_id": "$all_slots.medication_id",
                "total_quantity_used": {"$sum": "$all_slots.quantity"}
            }
        },
        {
            "$lookup": {
                "from": "medications",
                "let": {"med_id": "$_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$eq": [{"$toString": "$_id"}, "$$med_id"]
                            }
                        }
                    }
                ],
                "as": "medication_info"
            }
        },
        {
            "$project": {
                "_id": 0,
                "medication_id": "$_id",
                "medication_name": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$medication_info.name", 0]},
                        "Unknown Medication"
                    ]
                },
                "total_quantity_used": 1
            }
        },
        {"$sort": {"total_quantity_used": -1}}
    ]

    results = list(mongo.db.cycles.aggregate(pipeline))
    return jsonify({"data": results}), 200


# GET /reports/stock-valuation
@reports_bp.get("/stock-valuation")
@jwt_required
def stock_valuation():
    pipeline = [
        {
            "$project": {
                "name": 1,
                "stock_quantity": 1,
                "price_per_unit": 1,
                "stock_value": {
                    "$multiply": ["$stock_quantity", "$price_per_unit"]
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "total_stock_value": {"$sum": "$stock_value"},
                "medications": {
                    "$push": {
                        "name": "$name",
                        "stock_quantity": "$stock_quantity",
                        "price_per_unit": "$price_per_unit",
                        "stock_value": "$stock_value"
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "total_stock_value": 1,
                "medications": 1
            }
        }
    ]

    results = list(mongo.db.medications.aggregate(pipeline))

    if not results:
        return jsonify({
            "data": {
                "total_stock_value": 0,
                "medications": []
            }
        }), 200

    return jsonify({"data": results[0]}), 200