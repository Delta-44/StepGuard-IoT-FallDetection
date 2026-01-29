## 📂 Project Structure
[cite_start]The repository is organized into four main modules to ensure a clear separation of concerns [cite: 14-24]:

* [cite_start]**`device/`**: ESP32 Firmware, sensor logic (MPU6050), and Wi-Fi communication[cite: 16, 17, 40, 42].
* [cite_start]**`backend/`**: REST API, JWT authentication, and business logic[cite: 18, 19, 61, 65].
* [cite_start]**`frontend/`**: Responsive Web Application for monitoring and management[cite: 20, 21, 78, 81].
* [cite_start]**`docs/`**: Technical documentation, architecture diagrams, and user manuals [cite: 22, 23, 107-113].

## 🛠️ Tech Stack
* [cite_start]**IoT:** ESP32, MPU6050 (Accelerometer/Gyroscope), LED/Buzzer, and Emergency Button[cite: 40, 42, 45, 46].
* [cite_start]**Backend:** Node.js + Express / Spring Boot with JWT Security[cite: 63, 65, 73].
* [cite_start]**Frontend:** React / Angular with responsive design[cite: 80, 81].
* [cite_start]**Database:** Relational Database (SQL)[cite: 76, 77].
* [cite_start]**Communication:** HTTP REST or MQTT[cite: 50, 51].

## 👥 Team & Responsibilities
[cite_start]The project is developed by a team of 7 members, divided into strategic work fractions[cite: 10, 11, 114]:

| Dev | Role | Key Responsibility |
| :--- | :--- | :--- |
| **1** | **IoT Core** | [cite_start]Sensor data acquisition and fall detection logic [cite: 47-49]. |
| **2** | **Backend Lead** | [cite_start]API architecture, security, and device authentication [cite: 64-66]. |
| **3** | **Database Spec** | [cite_start]Relational schema design (ER) and data persistence[cite: 110]. |
| **4** | **Frontend Logic** | [cite_start]API integration and global state management[cite: 82, 83]. |
| **5** | **UI/UX & Viz** | [cite_start]Dashboard design, responsive layouts, and data visualization [cite: 84-88]. |
| **6** | **QA & Docs** | [cite_start]Technical manuals, flowcharts, and system testing [cite: 109-113]. |
| **7** | **System Extras** | [cite_start]Integration of notifications and advanced features [cite: 95-106]. |

## 🔄 Workflow Guidelines
[cite_start]To maintain code quality and collaborative efficiency, the following rules are mandatory [cite: 25-29]:
* **Branching:** Use `main` for production and `develop` for integration.
* **Feature Branches:** Develop each task in a separate `feature/` branch.
* **Pull Requests:** All code must be reviewed via PR before merging into `develop`.
* **Issues:** Every task must be tracked using GitHub Issues.
* **Commits:** Use descriptive messages (e.g., `feat: add fall detection algorithm`).

## 📋 Documentation Requirements
[cite_start]The `/docs` folder must contain the following deliverables [cite: 107-114]:
1. [cite_start]Architecture Diagram[cite: 109].
2. [cite_start]Entity-Relationship (ER) Diagram[cite: 110].
3. [cite_start]Fall Detection Flowchart[cite: 111].
4. [cite_start]Technical & User Manuals[cite: 112, 113].
5. [cite_start]Group Task Distribution[cite: 114].

---
[cite_start]*This project is part of an educational initiative focused on social responsibility through technology[cite: 115, 122].*
