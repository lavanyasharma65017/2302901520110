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


# Stage 2

## Recommended Database

I recommend **PostgreSQL** as the primary database for the notification system.

### Reasons

* Strong ACID compliance ensures data consistency.
* Efficient indexing and query optimization.
* Handles large-scale notification data effectively.
* Supports partitioning for future scalability.
* Reliable support for filtering, sorting, and pagination.

---

## Database Schema

### Students Table

| Column     | Type         | Description          |
| ---------- | ------------ | -------------------- |
| student_id | BIGINT       | Primary Key          |
| name       | VARCHAR(100) | Student Name         |
| email      | VARCHAR(255) | Student Email        |
| created_at | TIMESTAMP    | Record Creation Time |

### Notifications Table

| Column            | Type                               | Description           |
| ----------------- | ---------------------------------- | --------------------- |
| notification_id   | UUID                               | Primary Key           |
| student_id        | BIGINT                             | Foreign Key           |
| notification_type | ENUM('Event','Result','Placement') | Notification Category |
| title             | VARCHAR(255)                       | Notification Title    |
| message           | TEXT                               | Notification Content  |
| is_read           | BOOLEAN                            | Read Status           |
| created_at        | TIMESTAMP                          | Notification Time     |

---

## Relationships

* One student can receive multiple notifications.
* Each notification belongs to one student.

---

## Sample SQL Queries

### Create Notification

```sql
INSERT INTO notifications (
notification_id,
student_id,
notification_type,
title,
message,
is_read,
created_at
)
VALUES (
gen_random_uuid(),
1042,
'Placement',
'Placement Opportunity',
'CSX Corporation is hiring',
false,
NOW()
);
```

### Get All Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC;
```

### Get Unread Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = false
ORDER BY created_at DESC;
```

### Mark Notification As Read

```sql
UPDATE notifications
SET is_read = true
WHERE notification_id =
'd146095a-0d86-4a34-9e69-3900a14576bc';
```

### Delete Notification

```sql
DELETE FROM notifications
WHERE notification_id =
'd146095a-0d86-4a34-9e69-3900a14576bc';
```

---

## Scalability Challenges

As data volume increases to millions of notifications:

1. Slow query execution.
2. Large table scans.
3. Increased storage requirements.
4. Higher database load.
5. Longer response times.

---

## Proposed Solutions

### Indexing

Create indexes on frequently queried columns.

```sql
CREATE INDEX idx_student_read
ON notifications(student_id, is_read);
```

### Partitioning

Partition notifications by month or year.

Benefits:

* Faster queries.
* Easier maintenance.
* Reduced scan size.

### Pagination

Fetch records in smaller chunks.

Example:

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Archiving

Move old notifications to archive tables.

Benefits:

* Smaller active dataset.
* Improved query performance.

---

## Conclusion

PostgreSQL provides strong consistency, scalability, indexing capabilities, and efficient query performance, making it a suitable database choice for a large-scale campus notification platform.


# Stage 3

## Query Performance Analysis

### Given Query

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt ASC;
```

---

## Why Is This Query Slow?

The notifications table contains millions of records.

Without proper indexes, the database must scan every row to find matching records.

Problems:

* Full table scan
* High CPU usage
* Increased query execution time
* Poor scalability

---

## Recommended Index

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at);
```

### Benefits

* Faster filtering by student_id
* Faster filtering by read status
* Faster sorting using created_at
* Reduced query execution time

---

## Placement Notifications Query

To identify students who received placement notifications in the last 7 days:

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

### Why DISTINCT?

A student may receive multiple placement notifications.

DISTINCT ensures each student appears only once.

---

## Why Not Create Indexes On Every Column?

Although indexes improve read performance, excessive indexing causes:

### Increased Storage Usage

Every index consumes additional disk space.

### Slower Inserts

Whenever a new notification is inserted, all indexes must be updated.

### Slower Updates

Updating indexed columns requires index maintenance.

### Higher Memory Consumption

Large numbers of indexes increase memory requirements.

---

## Best Practice

Create indexes only on columns frequently used in:

* WHERE clauses
* JOIN operations
* ORDER BY clauses
* Search filters

---

## Conclusion

The recommended composite index significantly improves notification retrieval performance while avoiding unnecessary indexing overhead. A balanced indexing strategy provides faster queries, lower resource consumption, and better scalability for large datasets.


# Stage 4

## Handling Database Overload

As the number of students and notifications increases, the database may become overloaded due to frequent read requests.

### Current Problem

Every time a student opens the notification page, a database query is executed.

Flow:

Student → Backend → Database

With thousands of active users, this can significantly increase database load and response time.

---

## Solution 1: Redis Cache

Store frequently accessed notifications in Redis.

Flow:

Student → Backend → Redis Cache

If data is available in Redis, the database is not queried.

### Advantages

* Faster response time
* Reduced database load
* Better scalability

### Trade-off

* Additional infrastructure and memory usage

---

## Solution 2: Pagination

Instead of loading all notifications at once, load them in smaller chunks.

Example:

```sql
SELECT *
FROM notifications
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Advantages

* Reduced query execution time
* Lower memory usage
* Better user experience

---

## Solution 3: WebSockets

Avoid frequent polling requests.

Instead of:

Student → Backend every 5 seconds

Use:

Backend → Push notification instantly

### Advantages

* Real-time updates
* Fewer API calls
* Reduced server load

---

## Solution 4: Read Replicas

Use database replicas for read operations.

Architecture:

Primary Database
↓
Read Replica 1
↓
Read Replica 2

### Advantages

* Better read performance
* Reduced load on primary database
* Improved scalability

---

## Recommended Approach

A combination of:

* Redis Cache
* Pagination
* WebSockets
* Read Replicas

provides the best performance, scalability, and user experience for a large-scale notification system.

---

## Conclusion

The proposed optimizations reduce database load, improve response times, and ensure that the notification platform remains responsive even when serving thousands of students simultaneously.


# Stage 5

## Redesigning the "Notify All Students" Feature

### Existing Approach

Currently, notifications are sent one student at a time.

Example:

```python
for student in students:
    save_notification(student)
    send_email(student)
    send_push_notification(student)
```

### Problems

* Slow execution for thousands of students
* High server load
* Failure of one operation may interrupt the process
* Difficult to scale
* Poor fault tolerance

---

## Proposed Architecture

Use an asynchronous message queue system.

Architecture:

HR/Admin

↓

Notification Service

↓

Message Queue (Kafka / RabbitMQ)

↓

Worker Services

↓

Database + Email Service + Push Notification Service

---

## Workflow

### Step 1

HR creates a notification.

### Step 2

Notification Service validates the request.

### Step 3

A notification job is pushed to the queue.

### Step 4

Workers consume jobs from the queue.

### Step 5

Workers:

* Save notification to database
* Send email notifications
* Send push notifications

---

## Retry Mechanism

If email delivery fails:

Worker

↓

Retry Queue

↓

Retry Processing

This prevents notification loss.

---

## Benefits

### Scalability

Multiple workers can process jobs simultaneously.

### Reliability

Failures do not stop the entire process.

### Faster Response Time

The API responds immediately after placing a job in the queue.

### Fault Tolerance

Failed tasks can be retried automatically.

---

## Recommended Technologies

### Message Queue

* Apache Kafka
* RabbitMQ

### Database

* PostgreSQL

### Cache

* Redis

### Notification Delivery

* Email Service
* Push Notification Service

---

## Conclusion

A queue-based architecture significantly improves performance, scalability, reliability, and fault tolerance. It is suitable for sending notifications to thousands of students efficiently without overloading the application server.

