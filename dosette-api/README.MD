# 💊 Dosette Management REST API

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-Backend-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Status](https://img.shields.io/badge/Project-University%20Coursework-success)

A **Flask + MongoDB REST API** designed to simulate a **pharmacy dosette
tray management system**.\
The system manages patients, medications, weekly dosette cycles, and
automatically generated picking lists used to prepare medication trays.

This project demonstrates **REST API design, authentication, role‑based
access control, and MongoDB aggregation queries**.

------------------------------------------------------------------------

# 📚 Table of Contents

- Overview
- Technology Stack
- System Architecture
- Authentication & Security
- User Roles
- Core Entities
- API Endpoints
- Pagination & Filtering
- Running the API
- Testing
- Example Responses

------------------------------------------------------------------------

# 🧾 Overview

Pharmacies often prepare **weekly dosette trays** where a patient's
medications are organised by:

- Day of the week
- Time of day (morning / afternoon / evening)

This API provides a backend system to manage that workflow:

1. Manage **patients**
2. Manage **medications**
3. Create **weekly dosette cycles**
4. Generate **picking lists** for tray preparation
5. Produce **usage and stock reports**

The system uses **JWT authentication**, **role‑based access control**,
and **token blacklisting** for secure API usage.

------------------------------------------------------------------------

# ⚙️ Technology Stack

| Component \| Technology \|

\| Backend \| Flask (Python) \|

\| Database \| MongoDB \|

\| Authentication \| JWT \|

\| Password Security \| bcrypt \|

\| API Testing \| Postman \|

\| Data Format \| JSON \|

------------------------------------------------------------------------

# ⚙️ System Architecture

    Client (Postman / Frontend)
            │
            ▼
    Flask REST API
            │
            ▼
    Authentication Middleware (JWT + Roles)
            │
            ▼
    MongoDB Database

------------------------------------------------------------------------

# 🔐 Authentication & Security

The API uses **JWT authentication**.

After login, a token must be included in requests:

    Authorization: Bearer <token>

### Security Features

- JWT Authentication
- Password hashing with bcrypt
- Role‑based access control
- Token expiration
- Token blacklisting
- Logout endpoint

### Token Blacklisting

When a user logs out:

1. The token is stored in the **blacklisted_tokens collection**
2. Any future request using that token is rejected

This prevents reused or revoked tokens.

------------------------------------------------------------------------

# 👥 User Roles

Role Description
  ---------------- ----------------------------------------------
**Admin**        Full system access including user management
**Pharmacist**   Can manage patients, medications, cycles
**Dispenser**    Can view and prepare picking lists

Role‑based access control ensures endpoints are restricted
appropriately.

------------------------------------------------------------------------

# 🧩 Core Entities

## Users

System users who access the API.

Fields:

- email
- password
- role
- created_at

------------------------------------------------------------------------

## Patients

Patients receiving dosette trays.

Fields:

- name
- date_of_birth
- phone
- allergies
- notes

------------------------------------------------------------------------

## Medications

Pharmacy medication stock.

Fields:

- name
- strength
- form
- batch_number
- stock_quantity
- expiry_date
- price_per_unit
- low_stock_threshold

The **batch_number** allows multiple stock entries for the same
medication.

------------------------------------------------------------------------

## Cycles

Represents a **weekly dosette tray** prepared for a patient.

Includes:

- patient_id
- week_start
- week_end
- status
- tray_structure

Each tray structure contains:

    monday
    tuesday
    wednesday
    thursday
    friday
    saturday
    sunday

Each day contains:

    morning
    afternoon
    evening

Each slot stores:

    medication_id
    quantity

------------------------------------------------------------------------

## Picking Lists

Picking lists summarise the **total medications required** to prepare a
weekly dosette tray.

Each item contains:

- medication_name
- strength
- form
- total_quantity

This helps pharmacy staff prepare trays efficiently.

------------------------------------------------------------------------

# 🌐 API Endpoints

## Authentication

Method Endpoint
  -------- ------------------
POST     `/auth/register`
POST     `/auth/login`
GET      `/auth/me`
POST     `/auth/logout`

------------------------------------------------------------------------

## Admin

Method Endpoint
  -------- --------------------------
GET      `/admin/users`
PUT      `/admin/users/{id}/role`
DELETE   `/admin/users/{id}`

------------------------------------------------------------------------

## Patients

Method Endpoint
  -------- ------------------
POST     `/patients`
GET      `/patients`
GET      `/patients/{id}`
PUT      `/patients/{id}`
DELETE   `/patients/{id}`

------------------------------------------------------------------------

## Medications

Method Endpoint
  -------- ---------------------
POST     `/medications`
GET      `/medications`
GET      `/medications/{id}`
PUT      `/medications/{id}`
DELETE   `/medications/{id}`

------------------------------------------------------------------------

## Cycles

Method Endpoint
  -------- -----------------------
POST     `/cycles`
GET      `/cycles`
GET      `/cycles/{id}`
PUT      `/cycles/{id}`
PUT      `/cycles/{id}/status`
DELETE   `/cycles/{id}`

------------------------------------------------------------------------

## Picking Lists

Method Endpoint
  -------- --------------------------------------
POST     `/picking-lists/generate/{cycle_id}`
GET      `/picking-lists`
GET      `/picking-lists/{id}`
DELETE   `/picking-lists/{id}`

------------------------------------------------------------------------

## Reports

Method Endpoint
  -------- ----------------------------------
GET      `/reports/most-used-medications`
GET      `/reports/stock-valuation`

------------------------------------------------------------------------

## Guest

Method Endpoint
  -------- --------------------------------
GET      `/guest/medications/low-stock`
GET      `/guest/medications/expired`

------------------------------------------------------------------------

# 📄 Pagination Example

    GET /patients?page=1&limit=10

------------------------------------------------------------------------

# ▶ Running the API

Start the server:

    python run.py

The API runs at:

    http://127.0.0.1:5000

------------------------------------------------------------------------

# 🧪 Testing

The API was tested using **Postman**.

Tests included:

- authentication
- role-based access control
- CRUD operations
- picking list generation
- reporting endpoints
- token blacklist validation

Saved request and response examples are included in the Postman
collection.

------------------------------------------------------------------------

# 📦 Example Response

Example picking list:

    {
      "items": [
        {
          "medication_name": "Paracetamol",
          "strength": "500mg",
          "form": "Tablet",
          "total_quantity": 14
        }
      ]
    }

------------------------------------------------------------------------

# 🎓 Conclusion

The Dosette Management REST API demonstrates a secure backend system
implementing:

- REST API design
- authentication and security
- role-based access control
- MongoDB aggregation reporting
- pharmacy-style medication workflow

This project models realistic pharmacy operations such as patient
medication scheduling, dosette tray preparation, and medication stock
tracking.
