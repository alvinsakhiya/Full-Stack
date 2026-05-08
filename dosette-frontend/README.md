# DosetteFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

# 💊 Dosette System & Inventory Management (Frontend)

This is the **Angular frontend application** for the Dosette System & Inventory Management platform. It provides a modern, responsive interface for managing patients, medications, dosette cycles, and picking lists.

---

## 🚀 Features

### 🔐 Authentication
- Email & Password login
- Google Login via Auth0 (OAuth)
- JWT-based session management
- Role-based access control (Admin, Pharmacist, Dispenser)

### 👤 Patient Management
- Add and manage patient records
- Search and filter patients

### 💊 Medication Management
- Manage medication data
- Link medications to cycles

### 📦 Dosette Cycle Management
- Create weekly cycles
- Manage tray structure (morning, afternoon, evening, bedtime)

### 📋 Picking Lists
- Generate picking lists
- Display medication details dynamically

### 🎨 UI/UX Enhancements
- Real-time form validation
- Password strength indicator
- Avatar generation (initials + Google profile image)
- Apple-style UI with smooth animations

---

## 🧠 Tech Stack

- **Frontend:** Angular (Standalone Components)
- **Styling:** CSS (Custom + Bootstrap)
- **Authentication:** Auth0 (Google OAuth) + JWT
- **API Integration:** RESTful Flask backend

---

## ⚙️ Installation & Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
ng serve
```

Open your browser at:
👉 http://localhost:4200

---

## 🔐 Authentication Flow

### Email Login
Angular → Flask API → JWT Token → Stored in localStorage

### Google Login (Auth0)
Angular → Auth0 → Google → Angular → Flask API → JWT Token

---

## 📁 Project Structure (Simplified)

```
src/
 ├── app/
 │   ├── pages/           # Login, Register, Dashboard, etc.
 │   ├── services/        # API services (auth, data)
 │   ├── components/      # Shared components (navbar)
 │   ├── interceptors/    # JWT token handling
 │   └── guards/          # Route protection
```

---

## 🧪 Running Tests

```bash
ng test
```

---

## 📦 Build for Production

```bash
ng build
```

Output will be generated in the `dist/` folder.

---

## 📘 Notes for Developers

- Ensure backend API is running before starting frontend
- Update environment configuration if backend URL changes
- Auth0 credentials must be configured correctly

---

## 👨‍💻 Author

Alvin Sakhiya  
BSc (Hons) Computing Systems

---

## 🏁 Summary

This application demonstrates a **full-stack architecture** integrating:
- Modern Angular frontend
- Flask REST API backend
- MongoDB database
- Auth0 OAuth authentication

Designed with scalability, usability, and real-world SaaS practices in mind.
# 💊 Dosette System & Inventory Management (Frontend)

![Angular](https://img.shields.io/badge/Angular-21-red)
![Auth0](https://img.shields.io/badge/Auth-Auth0-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-green)
![Status](https://img.shields.io/badge/Status-Completed-success)

---

## 📌 Overview

This is a **modern Angular frontend application** for the Dosette System & Inventory Management platform. It provides an intuitive, responsive, and production-level interface for managing pharmacy workflows including patients, medications, dosette cycles, and picking lists.

---

## 🚀 Key Features

### 🔐 Authentication System
- Email & Password login (JWT-based)
- Google Login via Auth0 (OAuth 2.0)
- Hybrid authentication (Auth0 + custom backend JWT)
- Role-based access control

### 👤 Patient Management
- Create and manage patient records
- Real-time search and filtering

### 💊 Medication Management
- Manage medication inventory
- Associate medications with cycles

### 📦 Dosette Cycle System
- Weekly cycle creation
- Tray structure (Morning, Afternoon, Evening, Bedtime)

### 📋 Picking Lists
- Generate picking lists dynamically
- Display medication details clearly for dispensers

### 🎨 UI/UX Enhancements
- Real-time validation
- Password strength meter
- Google avatar integration
- Apple-style UI animations

---

## 🧠 Technology Stack

| Layer | Technology |
|------|-----------|
| Frontend | Angular (Standalone Components) |
| Styling | CSS + Bootstrap |
| Auth | Auth0 (Google OAuth) + JWT |
| Backend | Flask REST API |
| Database | MongoDB |

---

## 🔐 Authentication Architecture

### Email Login
Angular → Flask API → JWT → LocalStorage

### Google Login (Auth0)
Angular → Auth0 → Google → Angular → Flask API → JWT

---

## ⚙️ Installation & Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
ng serve
```

Open:
👉 http://localhost:4200

---

## 📁 Project Structure

```
src/
 ├── app/
 │   ├── pages/
 │   ├── services/
 │   ├── components/
 │   ├── interceptors/
 │   └── guards/
```

---

## 📸 Screenshots (Add for submission)

- Login Page
- Google Authentication Flow
- Dashboard
- Picking Lists

---

## 🧪 Testing

```bash
ng test
```

Includes:
- Authentication testing
- Role-based access
- CRUD operations
- UI validation

---

## 📦 Production Build

```bash
ng build
```

Output in `/dist`

---

## 📘 Developer Notes

- Ensure backend API is running before frontend
- Configure Auth0 credentials correctly
- Update API base URL if needed

---

## 👨‍💻 Author

**Alvin Sakhiya**  
BSc (Hons) Computing Systems

---

## 🏁 Final Summary

This project demonstrates:
- Full-stack development
- OAuth integration (Auth0)
- Secure JWT authentication
- Scalable architecture
- Advanced UI/UX practices

Built following **real-world SaaS standards**.