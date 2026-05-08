

# 💊 Dosette System & Inventory Management (Frontend)

![Angular](https://img.shields.io/badge/Angular-21-red)
![Auth0](https://img.shields.io/badge/Auth-Auth0-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-green)
![Status](https://img.shields.io/badge/Status-Completed-success)

---

## 📌 Overview

This project is a modern full-stack pharmacy management frontend built using Angular.
It supports pharmacy workflows such as patient management, medication tracking, dosette cycle preparation, picking lists, reporting, and secure authentication.

The application integrates with a Flask REST API backend and MongoDB database while using JWT authentication and Auth0 Google OAuth for secure access control.

---

## 🚀 Key Features

### 🔐 Authentication & Security
- Email & Password login
- Google Login via Auth0
- JWT-based authentication
- Role-based access control
- Secure HTTP interceptor integration

### 👤 Patient Management
- Add, edit, and manage patients
- Search and filter functionality
- Inline editing and modal views

### 💊 Medication Management
- Medication inventory management
- Batch and expiry tracking
- Stock level monitoring

### 📦 Dosette Cycle Management
- Weekly dosette cycle creation
- Dynamic tray structure generation
- Morning, afternoon, evening, and bedtime scheduling

### 📋 Picking Lists & Workflow
- Dynamic picking list generation
- Real-time stock validation
- Preparation workflow tracking
- Label printing support

### 📊 Reports & Analytics
- Most-used medication reports
- Stock valuation insights
- Dashboard statistics and charts

### 🎨 UI / UX Features
- Apple-inspired modern UI
- Real-time validation
- Password strength indicator
- Google avatar integration
- Smooth animations and responsive layout

---

## 🧠 Technology Stack

| Layer | Technology |
|------|-----------|
| Frontend | Angular 21 |
| Styling | CSS + Bootstrap |
| Authentication | Auth0 + JWT |
| Backend API | Flask REST API |
| Database | MongoDB |

---

## 🔐 Authentication Architecture

### Email Authentication
Angular → Flask API → JWT Token → LocalStorage

### Google Authentication
Angular → Auth0 → Google OAuth → Flask API → JWT Token

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/alvinsakhiya/Full-Stack.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
ng serve
```

Open browser:

```text
http://localhost:4200
```

---

## 📁 Project Structure

```text
src/
 ├── app/
 │   ├── pages/
 │   ├── services/
 │   ├── components/
 │   ├── interceptors/
 │   ├── guards/
 │   └── models/
```

---

## 📸 Screenshots

### 🔐 Login Page

### 📊 Dashboard

### 📋 Picking Lists

### 💊 Medication Management

---

## 🧪 Testing

The application was tested for:

- Authentication flows
- Role-based access
- CRUD functionality
- API integration
- Form validation
- Error handling
- Responsive UI behaviour

---

## 📦 Production Build

```bash
ng build
```

Build output will be generated inside:

```text
/dist
```

---

## 📘 Developer Notes

- Ensure backend API is running before frontend
- Configure Auth0 credentials correctly
- Update API base URL if backend changes
- Remove `node_modules` before coursework submission

---

## 👨‍💻 Author

**Alvin Sakhiya**
BSc (Hons) Computing Systems
Ulster University

---

## 🏁 Final Summary

This application demonstrates:
- Full-stack application development
- Secure JWT and OAuth authentication
- REST API integration
- Advanced Angular frontend architecture
- Real-world pharmacy workflow implementation
- Modern UI/UX design practices

Built following scalable and professional SaaS development principles.
