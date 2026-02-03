# API Endpoints

Base URL: `http://localhost:3000`

## Authentication (`/api/auth`)

### Register User

- **URL:** `/api/auth/register/usuario`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "edad": 30,
    "direccion": "123 Main St",
    "telefono": "555-0123",
    "dispositivo_id": "ESP32-DEVICE-ID"
  }
  ```

### Register Caregiver

- **URL:** `/api/auth/register/cuidador`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "caregiver@example.com",
    "password": "password123",
    "name": "Jane Smith",
    "telefono": "555-9876",
    "is_admin": false
  }
  ```

### Login

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Google Login

- **URL:** `/api/auth/google`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "token": "GOOGLE_ID_TOKEN"
  }
  ```

## ESP32 Device Data (`/api/esp32`)

### Receive Device Data

- **URL:** `/api/esp32/data`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "deviceId": "ESP32-DEVICE-ID",
    "temperature": 28.4,
    "humidity": 55,
    "isFallDetected": false,
    "batteryLevel": 92,
    "timestamp": "2024-02-03T10:00:00.000Z"
  }
  ```

### Get Device Data

- **URL:** `/api/esp32/data/:deviceId`
- **Method:** `GET`
- **Params:** `deviceId` (string)
- **Response:** JSON object with latest device data.

## System

### Health Check

- **URL:** `/`
- **Method:** `GET`
- **Response:** `{"message": "StepGuard Backend API is running"}`

### Protected Route Example

- **URL:** `/api/protected`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
