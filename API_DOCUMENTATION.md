# Chat API Documentation

This document provides a clean, developer-focused API specification for the EchoChat application backend. It is derived from the official Swagger specification and validated against live API response inspections.

---

## 1. Base URLs
* **REST API**: `https://frontend-task-chatapp.onrender.com/api`
* **WebSocket (Socket.io)**: `https://frontend-task-chatapp.onrender.com` *(Root server origin)*

---

## 2. Authentication Flow
Authentication is managed via JSON Web Tokens (JWT). 
1. Log in or register using `POST /auth/login`.
2. Secure all subsequent REST requests by adding the token to the header:
   `Authorization: Bearer <token>`
3. Secure the WebSocket connection by passing the token in the Socket.io handshake auth object:
   `{ auth: { token } }`

---

## 3. REST API Endpoints

### 3.1 Authentication

#### **Log in or Register**
* **Method**: `POST`
* **Path**: `/auth/login`
* **Description**: One-step login and registration. If the phone number is new, a new account is automatically registered. If it exists, the user is logged in.
* **Request Body**:
  ```json
  {
    "phone": "+15550000001",
    "name": "Ada Lovelace"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6a882806e5d6aac97521e4b3",
      "name": "Ada Lovelace",
      "phone": "+15550000001",
      "createdAt": "2026-08-21T10:27:18.226Z"
    }
  }
  ```

#### **Get Current User Profile**
* **Method**: `GET`
* **Path**: `/auth/me`
* **Description**: Retrieves the profile matching the Bearer token.
* **Headers**: `Authorization: Bearer <token>`
* **Response Body (200 OK)**:
  ```json
  {
    "_id": "6a882806e5d6aac97521e4b3",
    "name": "Ada Lovelace",
    "phone": "+15550000001",
    "createdAt": "2026-08-21T10:27:18.226Z"
  }
  ```

---

### 3.2 User Search

#### **Search Users**
* **Method**: `GET`
* **Path**: `/users/search`
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `q` (string, required) — The name or phone number search query.
* **Response Body (200 OK)**:
  ```json
  {
    "value": [
      {
        "_id": "6a88282ce5d6aac97521e4fd",
        "name": "Test User Two",
        "phone": "+15550000002"
      }
    ],
    "Count": 1
  }
  ```

---

### 3.3 Conversations

#### **List Conversations**
* **Method**: `GET`
* **Path**: `/conversations`
* **Headers**: `Authorization: Bearer <token>`
* **Response Body (200 OK)**:
  ```json
  {
    "data": [
      {
        "_id": "6a88284fe5d6aac97521e56f",
        "type": "direct",
        "lastMessage": {
          "text": "Hello World!",
          "sender": "6a882806e5d6aac97521e4b3",
          "createdAt": "2026-08-21T10:28:55.234Z"
        },
        "updatedAt": "2026-08-21T10:28:55.469Z",
        "participant": {
          "_id": "6a88282ce5d6aac97521e4fd",
          "name": "Test User Two",
          "phone": "+15550000002"
        }
      },
      {
        "_id": "6a882899e5d6aac97521e5bc",
        "type": "group",
        "name": "Awesome Group",
        "createdBy": "6a882806e5d6aac97521e4b3",
        "admins": [
          "6a882806e5d6aac97521e4b3"
        ],
        "participants": [
          { "_id": "6a882806e5d6aac97521e4b3", "name": "Ada Lovelace", "phone": "+15550000001" },
          { "_id": "6a88282ce5d6aac97521e4fd", "name": "Test User Two", "phone": "+15550000002" },
          { "_id": "6a88288fe5d6aac97521e5a2", "name": "Test User Three", "phone": "+15550000003" }
        ],
        "lastMessage": {},
        "createdAt": "2026-08-21T10:29:45.505Z",
        "updatedAt": "2026-08-21T10:29:45.505Z"
      }
    ]
  }
  ```

#### **Start a Direct (1-to-1) Conversation**
* **Method**: `POST`
* **Path**: `/conversations`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "userId": "6a88282ce5d6aac97521e4fd"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "_id": "6a88284fe5d6aac97521e56f",
    "participants": [
      "6a882806e5d6aac97521e4b3",
      "6a88282ce5d6aac97521e4fd"
    ],
    "createdAt": "2026-08-21T10:28:31.500Z",
    "updatedAt": "2026-08-21T10:28:31.500Z"
  }
  ```

#### **Create a Group Conversation**
* **Method**: `POST`
* **Path**: `/conversations/group`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Creator starts as the group admin. The group must contain at least 3 members.
* **Request Body**:
  ```json
  {
    "name": "Awesome Group",
    "participantIds": [
      "6a88282ce5d6aac97521e4fd",
      "6a88288fe5d6aac97521e5a2"
    ]
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "_id": "6a882899e5d6aac97521e5bc",
    "type": "group",
    "name": "Awesome Group",
    "createdBy": "6a882806e5d6aac97521e4b3",
    "admins": [
      "6a882806e5d6aac97521e4b3"
    ],
    "participants": [
      { "_id": "6a882806e5d6aac97521e4b3", "name": "Ada Lovelace", "phone": "+15550000001" },
      { "_id": "6a88282ce5d6aac97521e4fd", "name": "Test User Two", "phone": "+15550000002" },
      { "_id": "6a88288fe5d6aac97521e5a2", "name": "Test User Three", "phone": "+15550000003" }
    ],
    "createdAt": "2026-08-21T10:29:45.505Z",
    "updatedAt": "2026-08-21T10:29:45.505Z"
  }
  ```

#### **Rename a Group**
* **Method**: `PATCH`
* **Path**: `/conversations/{id}`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Admins only. Renames the specified group.
* **Request Body**:
  ```json
  {
    "name": "Renamed Group Name"
  }
  ```

---

### 3.4 Group Member Management

#### **Add Members to a Group**
* **Method**: `POST`
* **Path**: `/conversations/{id}/participants`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Admins only. Adds one or more members to the group.
* **Request Body**:
  ```json
  {
    "userIds": [
      "6a88288fe5d6aac97521e5a2"
    ]
  }
  ```

#### **Remove a Member / Leave a Group**
* **Method**: `DELETE`
* **Path**: `/conversations/{id}/participants/{userId}`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Admins only to remove other members. Any user can pass their own ID to leave the group.

#### **Promote a Member to Admin**
* **Method**: `POST`
* **Path**: `/conversations/{id}/admins`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Admins only. Promotes an existing member to admin status.
* **Request Body**:
  ```json
  {
    "userId": "6a88282ce5d6aac97521e4fd"
  }
  ```

---

### 3.5 Messages

#### **Get Message History**
* **Method**: `GET`
* **Path**: `/conversations/{id}/messages`
* **Headers**: `Authorization: Bearer <token>`
* **Query Parameters**:
  * `limit` (integer, optional) — Max messages to load (default: 20).
  * `before` (string, optional) — Message `_id` cursor for fetching older pages.
* **Response Body (200 OK)**:
  ```json
  {
    "messages": [
      {
        "_id": "6a882867e5d6aac97521e580",
        "conversation": "6a88284fe5d6aac97521e56f",
        "sender": "6a882806e5d6aac97521e4b3",
        "text": "Hello World!",
        "createdAt": "2026-08-21T10:28:55.234Z"
      }
    ],
    "hasMore": false
  }
  ```

#### **Send a Message**
* **Method**: `POST`
* **Path**: `/messages`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "conversationId": "6a88284fe5d6aac97521e56f",
    "text": "Hello World!"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "_id": "6a882867e5d6aac97521e580",
    "conversation": "6a88284fe5d6aac97521e56f",
    "sender": "6a882806e5d6aac97521e4b3",
    "text": "Hello World!",
    "createdAt": "2026-08-21T10:28:55.234Z"
  }
  ```

---

## 4. WebSocket (Socket.io) Real-time Sync

Connect to the host root: `https://frontend-task-chatapp.onrender.com`.
The token must be provided in the handshake auth config.

### Handshake Connection
```javascript
const socket = io('https://frontend-task-chatapp.onrender.com', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Supported Events

#### **Server → Client Events (Listeners)**
* **`message:new`** — Fired when a new message is received in any conversation the user belongs to.
  * **Payload**: `Message` object
    ```json
    {
      "_id": "6a882867e5d6aac97521e580",
      "conversation": "6a88284fe5d6aac97521e56f",
      "sender": "6a882806e5d6aac97521e4b3",
      "text": "Hello World!",
      "createdAt": "2026-08-21T10:28:55.234Z"
    }
    ```
* **`conversation:updated`** — Fired when a group you belong to is created, renamed, or members/admins change.
  * **Payload**: Updated `Conversation` object (direct/group structure)

#### **Client → Server Events (Emitters)**
* **`message:send`** — Alternative method to send messages over the socket instead of using REST.
  * **Payload**:
    ```json
    {
      "conversationId": "6a88284fe5d6aac97521e56f",
      "text": "Hello over socket!"
    }
    ```

---

## 5. Error Handling and Status Codes

### Error Payload Format
If a request fails, the API returns a structured error object inside the response body:
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "phone",
        "message": "Required"
      }
    ]
  }
}
```

### HTTP Status Codes
* **200 OK**: Request succeeded. Returns the requested resource or object.
* **400 Bad Request**: Invalid parameters or payloads (e.g., group contains fewer than 3 members, missing fields). Code: `VALIDATION_ERROR`.
* **401 Unauthorized**: Missing, expired, or invalid Bearer token.
* **404 Not Found**: Endpoint route or specified resource ID does not exist. Code: `NOT_FOUND`.
* **500 Server Error**: Internal API crash. Code: `SERVER_ERROR`.

---

## 6. Implementation Notes & Best Practices

1. **Sender Metadata Workaround**: The `/conversations/{id}/messages` and `message:new` payloads return `sender` as a string ID only. Clients should lookup sender metadata in the `Conversation` object's `participants` array (for groups) or the `participant` field (for direct chats).
2. **REST for Sending, Sockets for Listening**: It is recommended to send messages via `POST /messages` to ensure direct receipt of API validation errors, while relying on the socket's `message:new` event for incoming real-time syncing.
3. **Render Cold Starts**: Because the backend is hosted on a free tier instance, requests will face delays if the server has gone to sleep. Display loading animations on authentication to manage user experience.
