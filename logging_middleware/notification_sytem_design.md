# Stage 1

## Notification System Overview

The notification platform enables students to receive Placement, Result and Event notifications in real time.

### API 1: Get All Notifications

GET /api/notifications

Response

```json
{
  "notifications": [
    {
      "id": "1",
      "type": "Placement",
      "message": "Google Hiring Drive",
      "isRead": false,
      "createdAt": "2026-06-03T10:00:00Z"
    }
  ]
}
```

### API 2: Get Notification By ID

GET /api/notifications/{id}

### API 3: Mark Notification As Read

PATCH /api/notifications/{id}/read

Response

```json
{
  "success": true
}
```

### API 4: Mark All Notifications As Read

PATCH /api/notifications/read-all

### Real Time Notification Design

The system uses WebSockets for real time notification delivery.

Flow:

HR/Admin
→ Notification Service
→ WebSocket Server
→ Student Client

Whenever a new notification is created, it is pushed instantly to connected students.

---

# Stage 2

## Database Selection

PostgreSQL is selected because it provides ACID compliance, strong indexing support, reliability and scalability.

### Students Table

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255)
);
```

### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    student_id UUID,
    notification_type VARCHAR(20),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);
```

### Sample Query

```sql
SELECT *
FROM notifications
WHERE student_id='123'
AND is_read=false;
```

### Scaling Challenges

As notification volume increases, query latency and storage requirements increase.

Solutions:

- Indexing
- Table Partitioning
- Redis Cache
- Read Replicas

---

# Stage 3

## Query Analysis

Given Query

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt ASC;
```

### Why Is It Slow?

The query may perform a full table scan when indexes are absent. With millions of notifications, this becomes expensive and increases response time.

### Recommended Index

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at);
```

### Why Not Index Every Column?

Indexes consume storage and slow down INSERT and UPDATE operations. Therefore, indexes should only be created on frequently queried columns.

### Placement Notifications In Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type='Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

---

# Stage 4

## Performance Improvements

### Redis Cache

Frequently accessed notifications can be stored in Redis to reduce database load.

### Pagination

Instead of fetching all notifications at once, return limited records per request.

Example:

```sql
SELECT *
FROM notifications
LIMIT 20 OFFSET 0;
```

### WebSockets

Replace frequent polling with real-time push notifications.

### Read Replicas

Use read replicas to distribute read traffic and reduce load on the primary database.

### Benefits

- Faster response times
- Reduced database load
- Better user experience
- Improved scalability

---

# Stage 5

## Problems With Current Approach

Sending notifications one user at a time is slow and vulnerable to failures.

Example:

```python
for student in students:
    send_email(student)
    save_to_db(student)
    push_notification(student)
```

If the email service fails midway, some users may receive notifications while others do not.

## Proposed Solution

Use an asynchronous queue-based architecture.

Architecture:

HR/Admin
→ Notification Service
→ Message Queue (Kafka/RabbitMQ)
→ Worker Services

Workers:

- Save notification to database
- Send email
- Push in-app notification

### Retry Mechanism

Failed emails are placed into a retry queue and processed again automatically.

### Benefits

- Reliability
- Scalability
- Fault tolerance
- Faster processing