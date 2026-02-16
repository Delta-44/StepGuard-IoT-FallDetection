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

### Google Auth Redirect

- **URL:** `/api/auth/google`
- **Method:** `GET`
- **Description:** Initiates Google OAuth flow.

### Google Auth Callback

- **URL:** `/api/auth/google/callback`
- **Method:** `GET`
- **Description:** Callback URL for Google OAuth.

### Forgot Password

- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Reset Password

- **URL:** `/api/auth/reset-password`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "token": "RESET_TOKEN_FROM_EMAIL",
    "password": "newSecurePassword123"
  }
  ```

## ESP32 Device (`/api/esp32`)

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

- **URL:** `/api/esp32/data/:macAddress`
- **Method:** `GET`
- **Params:** `macAddress` (string)
- **Response:** JSON object with latest device data.

### Update Device Info

- **URL:** `/api/esp32/:macAddress`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `macAddress` (string)
- **Body:** (Device update fields)

## Users (`/api/users`)

### Get All Users

- **URL:** `/api/users`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Array of users.

### Export Users CSV

- **URL:** `/api/users/export/csv`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Downloads a CSV file of users.

### Get User by ID

- **URL:** `/api/users/:id`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `id` (string)
- **Response:** User object with device info.

### Update User

- **URL:** `/api/users/:id`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `id` (string)
- **Body:** (User fields to update)

### Admin Update User

- **URL:** `/api/users/:id/admin`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>` (Admin only)
- **Params:** `id` (string)
- **Body:**
  ```json
  {
    "role": "admin",
    "name": "New Name",
    "email": "newemail@example.com"
  }
  ```

### Delete User

- **URL:** `/api/users/:id`
- **Method:** `DELETE`
- **Headers:** `Authorization: Bearer <token>` (Admin only)
- **Params:** `id` (string)

### Assign Device to User

- **URL:** `/api/users/:id/device`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `id` (string)
- **Body:**
  ```json
  {
    "deviceId": "ESP32_MAC_ADDRESS"
  }
  ```

## Events (`/api/events`)

### Get Events

- **URL:** `/api/events`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** (Optional filters)

### Resolve Event

- **URL:** `/api/events/:id/resolve`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Params:** `id` (string)

## Alerts

### Alert Stream (SSE)

- **URL:** `/api/alerts/stream`
- **Method:** `GET`
- **Query Params:** `token` (JWT Token)
- **Description:** Server-Sent Events stream for real-time alerts.

## System

### Health Check

- **URL:** `/`
- **Method:** `GET`
- **Response:** `{"message": "StepGuard Backend API is running"}`

### Protected Route Example

- **URL:** `/api/protected`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### Upload Profile Photo

- **URL:** `/api/users/:id/photo`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Params:** `id` (string)
- **Body:**
  - `photo`: File (image)

## Chat (`/api/chat`)

### Send Message

- **URL:** `/api/chat`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "message": "Hello, how are you?",
    "history": [
        { "role": "user", "content": "Hi" },
        { "role": "assistant", "content": "Hello!" }
    ]
  }
  ```

### Clear History

- **URL:** `/api/chat/history`
- **Method:** `DELETE`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Clears the chat history for the authenticated user.
