# PulseUp2026 Domain Model Architecture

## Overview
This document outlines the domain entity structure for the PulseUp2026 appointment booking system. The domain layer defines the core business entities and their relationships using JPA annotations.

---

## Directory Structure

```
PulseUp2026/
└── src/
    └── main/
        └── java/
            └── ac/za/cput/pulseup/
                ├── domain/
                │   ├── User.java (Base class)
                │   ├── Student.java (extends User)
                │   ├── Staff.java (extends User)
                │   ├── Admin.java (extends User)
                │   ├── Appointment.java
                │   └── TimeSlot.java (@Embeddable)
                ├── factory/
                │   ├── UserFactory.java
                │   └── AppointmentFactory.java
                ├── repository/
                │   ├── UserRepository.java
                │   ├── AppointmentRepository.java
                │   └── TimeSlotRepository.java
                ├── service/
                │   ├── AuthService.java
                │   ├── BookingService.java
                │   ├── QueueService.java
                │   └── AdminService.java
                ├── controller/
                │   ├── AuthController.java
                │   ├── BookingController.java
                │   └── AdminController.java
                └── util/
                    ├── PasswordUtil.java
                    ├── JwtUtil.java
                    ├── TimeUtil.java
                    └── RoleValidator.java
```

---



## Design Patterns & Best Practices

### 1. **Inheritance Strategy: Single Table Inheritance**
- All User subclasses (Student, Staff, Admin) are stored in a single table
- Uses a discriminator column to distinguish types
- Advantages: Simple queries, better performance, no joins needed
- Disadvantages: Unused columns for specific types

### 2. **Embeddable Objects**
- TimeSlot is marked as `@Embeddable`
- Data is stored directly in the Appointment table (no separate TimeSlot table)
- Improves data cohesion and reduces queries

### 3. **Audit Fields**
- All entities include `createdAt` and `updatedAt` timestamps
- `@PreUpdate` annotation automatically updates the `updatedAt` field
- Provides audit trail for system tracking

### 4. **Lazy Loading**
- Relationships use `fetch = FetchType.LAZY` to improve performance
- Only loads related entities when explicitly accessed

### 5. **Unique Constraints**
- Email is unique for Users
- IDs (studentId, staffId, adminId) are unique per type
- appointmentCode is unique for each appointment

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────┐
│                      User (Base)                    │
├─────────────────────────────────────────────────────┤
│ - userId (PK)                                       │
│ - email (UNIQUE)                                    │
│ - passwordHash                                      │
│ - firstName, lastName                               │
│ - phoneNumber, isActive                             │
│ - createdAt, updatedAt                              │
└─────────────────────────────────────────────────────┘
           △           △           △
           │           │           │
           │           │           │
    ┌──────┴──┐   ┌────┴──┐   ┌───┴────┐
    │  Student│   │ Staff │   │ Admin  │
    └─────────┘   └───────┘   └────────┘

┌─────────────────────────────────────────────────────┐
│                  Appointment                        │
├─────────────────────────────────────────────────────┤
│ - appointmentId (PK)                                │
│ - appointmentCode (UNIQUE)                          │
│ - student (FK) ─── Many-to-One ─── Student          │
│ - staff (FK) ─── Many-to-One ─── Staff              │
│ - timeSlot (EMBEDDED) ─── TimeSlot                  │
│ - appointmentType, description                      │
│ - status, location, notes                           │
│ - createdAt, updatedAt                              │
└─────────────────────────────────────────────────────┘
```

---

## Coding Conventions

### Naming Conventions
- **Entity Classes:** CamelCase (e.g., `User`, `Student`, `Appointment`)
- **Attributes:** camelCase (e.g., `userId`, `firstName`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `serialVersionUID`)
- **Method Names:** camelCase with verb prefix (e.g., `getUserId()`, `setUserId()`)


### When Implementing Other Layers

**Factory Layer** (`factory/` package):
- Create factory classes for entity instantiation
- Use factory pattern for complex object creation
- Handle role-based user creation

**Repository Layer** (`repository/` package):
- Extend `JpaRepository<Entity, ID>`
- Implement custom query methods
- Handle database operations

**Service Layer** (`service/` package):
- Implement business logic
- Validate domain rules
- Orchestrate repository operations

**Controller Layer** (`controller/` package):
- Map HTTP requests to service calls
- Handle request/response DTOs
- Implement REST endpoints

**Utility Layer** (`util/` package):
- Security utilities (password hashing, JWT tokens)
- Time utilities (slot management, scheduling)
- Validation utilities (role checking)

---
