from flask import Blueprint, jsonify
from datetime import datetime
from app.extensions import mongo

guest_bp = Blueprint("guest", __name__)


# GET /guest/medications/low-stock
@guest_bp.get("/medications/low-stock")
def low_stock_medications():
    meds = mongo.db.medications.find({
        "$expr": {"$lte": ["$stock_quantity", "$low_stock_threshold"]}
    })

    result = []
    for med in meds:
        med["_id"] = str(med["_id"])
        result.append(med)

    return jsonify({"data": result}), 200


# GET /guest/medications/expired
@guest_bp.get("/medications/expired")
def expired_medications():
    today = datetime.utcnow()

    meds = mongo.db.medications.find({
        "expiry_date": {"$lt": today.strftime("%Y-%m-%d")}
    })

    result = []
    for med in meds:
        med["_id"] = str(med["_id"])
        result.append(med)

    return jsonify({"data": result}), 200