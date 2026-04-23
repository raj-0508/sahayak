# Sahayak - AI-Powered Teaching Assistant Platform

Sahayak is a comprehensive educational platform designed for multi-grade classrooms in India. It connects teachers and students through a modern web interface with AI-powered content generation capabilities.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Installation & Setup](#installation--setup)
4. [User Roles](#user-roles)
5. [Dashboard Features](#dashboard-features)
   - [Student Dashboard](#student-dashboard)
   - [Teacher Dashboard](#teacher-dashboard)
   - [Admin Dashboard](#admin-dashboard)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Default Login Credentials](#default-login-credentials)

---

## Project Overview

Sahayak is built to facilitate seamless communication between teachers and students. Teachers can manage multiple subjects, share educational content, and use AI to generate learning materials. Students can join classes, view shared content, and interact with their teachers.

### Key Features

- **Multi-Subject Support**: Teachers can teach multiple subjects simultaneously
- **AI Content Generation**: Powered by Google's Gemini AI for generating educational content
- **Role-Based Access Control**: Separate dashboards for Students, Teachers, and Admins
- **Class Management**: Students can request to join classes; teachers can approve/reject requests
- **Content Sharing**: Teachers can share notes, assignments, and AI-generated content with students
- **Admin Panel**: Comprehensive user and subject management

---

## Technology Stack

| Component      | Technology                     |
|----------------|-------------------------------|
| Backend        | Python Flask                   |
| Database       | MongoDB                        |
| Frontend       | HTML, CSS, JavaScript, Jinja2  |
| AI Integration | Google Gemini 2.0 Flash        |
| Authentication | JWT (JSON Web Tokens)          |
| Password Hash  | bcrypt                         |

---

## Installation & Setup

### Prerequisites

- Python 3.8+
- MongoDB (running locally or a cloud instance)
- pip (Python package manager)

### Steps

1. **Clone the repository**
   ```bash
   cd exported-assets
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables** (optional)
   ```bash
   set MONGO_URI=mongodb://localhost:27017/sahayak_db
   set SECRET_KEY=your-secret-key
   ```

4. **Seed the database** (optional, for test data)
   ```bash
   python new_seed.py
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the app**
   Open your browser and navigate to: `http://127.0.0.1:5000`

---

## User Roles

| Role    | Description                                                              |
|---------|--------------------------------------------------------------------------|
| Student | Can join classes, view shared content, and interact with teachers        |
| Teacher | Can manage subjects, accept students, share content, and generate AI content |
| Admin   | Full platform control: manage users, subjects, view logs, export data    |

---



at landing page actually there is jsut the signup and login i guess but we need to write about our webiste what it is and write about two types of user and below that para write like go to student signup or teacher signup and use background gradients colours acocrding to stylings neatly and at nav bar things should change accoridn to type of user 
## Dashboard Features

### Student Dashboard

**Route:** `/student/dashboard`

The Student Dashboard provides students with access to their enrolled classes and shared content.


they are having ai fetures: ai game genrator topic based quiz genrator, explainer , other features if u think usful for students add them too. 
#### Features

| Feature                  | Description                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| **View Available Teachers** | Browse a list of teachers and the subjects they teach                      |
| **Request to Join Class**   | Send a join request to a teacher for a specific subject                    |
| **View Enrolled Subjects**  | See all subjects the student is currently enrolled in                      |
| **View Shared Content**     | Access notes, assignments, and materials shared by teachers                |
| **Subject-wise Content**    | Content is organized by subject for easy navigation                        |

#### Functions

- `api_join_class()` - Sends a join request to a teacher for a specific subject
- Content is fetched from the `content` collection based on the student's enrolled classes

---

### Teacher Dashboard

**Route:** `/teacher/dashboard`

The Teacher Dashboard empowers teachers to manage their subjects, students, and content.

#### Features

| Feature                     | Description                                                                |
|-----------------------------|----------------------------------------------------------------------------|
| **Subject Management**      | View all subjects assigned to the teacher                                  |
| **Student List by Subject** | See enrolled students for each subject                                     |
| **Join Request Management** | Accept or reject student join requests                                     |
| **AI Content Generator**    | Generate educational content using Gemini AI                               |
| **Share Content**           | Share text content, notes, or AI-generated materials with a specific class |
| **Remove Students**         | Remove students from a class                                               |

#### Functions

| Function                    | Route                        | Description                                      |
|-----------------------------|------------------------------|--------------------------------------------------|
| `api_generate_content()`    | `POST /api/generate_content` | Generate text content using Gemini AI            |
| `api_generate_image()`      | `POST /api/generate_image`   | Generate images using DeepAI                     |
| `api_text_to_speech()`      | `POST /api/text_to_speech`   | Convert text to speech                           |
| `api_share_content()`       | `POST /api/share_content`    | Share content with students in a specific class  |
| `api_handle_join_request()` | `POST /api/handle_join_request` | Accept or reject a student's join request     |
| `api_remove_student()`      | `POST /api/remove_student`   | Remove a student from the teacher's class        |

#### AI Content Generation

Teachers can use the following AI-powered tools:

1. **Text Generation**: Create lesson plans, explanations, quizzes, and summaries
2. **Image Generation**: Generate educational visuals and diagrams
3. **Text-to-Speech**: Convert content to audio for accessibility

---

### Admin Dashboard

**Route:** `/admin/dashboard`

The Admin Dashboard provides complete control over the platform.

#### Overview Statistics

| Metric          | Description                          |
|-----------------|--------------------------------------|
| Total Users     | Count of all registered users        |
| Total Teachers  | Count of registered teachers         |
| Total Students  | Count of registered students         |
| Total Classes   | Count of active classes              |
| Signup Chart    | Visual chart of user signups over 7 days |

#### Features

| Feature                 | Description                                                       |
|-------------------------|-------------------------------------------------------------------|
| **User Management**     | View, edit, and delete all users on the platform                  |
| **Subject Management**  | Add, edit, and delete subjects available on the platform          |
| **Assign Subjects**     | Assign or remove subjects from teachers                           |
| **Recent Activity**     | View recently registered users with quick edit/delete actions     |
| **System Logs**         | View platform activity logs for debugging and monitoring          |
| **Data Export**         | Export user and class data as CSV files                           |

#### Admin Routes & Functions

| Function                  | Route                              | Description                                     |
|---------------------------|------------------------------------|-------------------------------------------------|
| `admin_dashboard()`       | `GET /admin/dashboard`             | Main admin dashboard with statistics            |
| `admin_manage_users()`    | `GET /admin/manage_users`          | List all users with edit/delete options         |
| `admin_edit_user()`       | `GET/POST /admin/edit_user/<id>`   | Edit user details and assign subjects           |
| `admin_delete_user()`     | `POST /admin/delete_user/<id>`     | Delete a user from the platform                 |
| `admin_add_user()`        | `POST /admin/add_user`             | Add a new user to the platform                  |
| `admin_manage_subjects()` | `GET/POST /admin/manage_subjects`  | Add and manage subjects                         |
| `admin_delete_subject()`  | `POST /admin/delete_subject/<id>`  | Delete a subject                                |
| `admin_export_data()`     | `GET /admin/export_data/<type>`    | Export data as CSV (users or classes)           |
| `admin_system_logs()`     | `GET /admin/system_logs`           | View system activity logs                       |

#### User Edit Page Features

When editing a user (especially teachers), admins can:

- Update name, email, and user type
- **Assign/Remove Subjects**: For teachers, checkboxes allow assigning or removing subjects

---

## API Endpoints

### Authentication

| Endpoint         | Method | Description                      |
|------------------|--------|----------------------------------|
| `/signup`        | POST   | Register a new user              |
| `/login`         | POST   | Authenticate and receive a token |
| `/logout`        | GET    | Clear session and logout         |

### Student APIs

| Endpoint          | Method | Description                           |
|-------------------|--------|---------------------------------------|
| `/api/join_class` | POST   | Send a join request to a teacher      |

### Teacher APIs

| Endpoint                   | Method | Description                          |
|----------------------------|--------|--------------------------------------|
| `/api/generate_content`    | POST   | Generate AI content                  |
| `/api/generate_image`      | POST   | Generate an image using AI           |
| `/api/text_to_speech`      | POST   | Convert text to speech               |
| `/api/share_content`       | POST   | Share content with a class           |
| `/api/handle_join_request` | POST   | Accept or reject a join request      |
| `/api/remove_student`      | POST   | Remove a student from a class        |

### Public APIs

| Endpoint        | Method | Description                       |
|-----------------|--------|-----------------------------------|
| `/api/subjects` | GET    | Get list of all available subjects|

---

## Database Schema

### Collections

#### `users`
| Field        | Type       | Description                                  |
|--------------|------------|----------------------------------------------|
| `_id`        | ObjectId   | Unique identifier                            |
| `name`       | String     | User's full name                             |
| `email`      | String     | User's email (must end with @klu.ac.in)      |
| `password`   | Binary     | Hashed password (bcrypt)                     |
| `user_type`  | String     | "student", "teacher", or "admin"             |
| `phone`      | String     | Phone number (optional)                      |
| `subject_ids`| Array      | List of subject ObjectIds (for teachers)     |
| `created_at` | DateTime   | Account creation timestamp                   |

#### `subjects`
| Field         | Type       | Description                      |
|---------------|------------|----------------------------------|
| `_id`         | ObjectId   | Unique identifier                |
| `name`        | String     | Subject name                     |
| `description` | String     | Subject description              |
| `grade_levels`| Array      | Applicable grade levels          |
| `image_url`   | String     | Subject image URL (optional)     |
| `created_at`  | DateTime   | Creation timestamp               |

#### `classes`
| Field         | Type       | Description                                |
|---------------|------------|--------------------------------------------|
| `_id`         | ObjectId   | Unique identifier                          |
| `teacher_id`  | String     | ID of the teacher who owns the class       |
| `teacher_name`| String     | Name of the teacher                        |
| `subject_id`  | String     | ID of the subject for this class           |
| `class_name`  | String     | Auto-generated class name                  |
| `students`    | Array      | List of student ObjectIds enrolled         |
| `created_at`  | DateTime   | Creation timestamp                         |

#### `join_requests`
| Field         | Type       | Description                               |
|---------------|------------|-------------------------------------------|
| `_id`         | ObjectId   | Unique identifier                         |
| `student_id`  | String     | ID of the student requesting              |
| `teacher_id`  | String     | ID of the teacher                         |
| `subject_id`  | String     | ID of the subject                         |
| `student_name`| String     | Name of the student                       |
| `student_email`| String    | Email of the student                      |
| `status`      | String     | "pending", "accepted", or "rejected"      |
| `created_at`  | DateTime   | Request timestamp                         |

#### `content`
| Field        | Type       | Description                                |
|--------------|------------|--------------------------------------------|
| `_id`        | ObjectId   | Unique identifier                          |
| `class_id`   | ObjectId   | ID of the class the content belongs to     |
| `teacher_id` | String     | ID of the teacher who shared the content   |
| `content`    | String     | The actual content/text                    |
| `created_at` | DateTime   | Sharing timestamp                          |

#### `logs`
| Field      | Type       | Description                    |
|------------|------------|--------------------------------|
| `_id`      | ObjectId   | Unique identifier              |
| `timestamp`| DateTime   | Log timestamp                  |
| `level`    | String     | Log level (INFO, WARN, ERROR)  |
| `message`  | String     | Log message                    |

---

## Default Login Credentials

After running `new_seed.py`, you can use these accounts:

| Role    | Email                       | Password   |
|---------|-----------------------------|------------|
| Admin   | thisyanthpolice@gmail.com   | thisyanth1 | this is the only constant thing meaning only one admin 
| Teacher | sharma@klu.ac.in            | teacher1   |
| Teacher | gupta@klu.ac.in             | teacher2   |
| Student | 99220040001@klu.ac.in       | student1   |
| Student | 99220040002@klu.ac.in       | student2   |
this is just mock data after creating databse we actually could be actually be able to create new accounts and do logins 
---


```

---

## License

This project is developed for educational purposes at kalasalingam University.

---

## Support

For any issues or questions, please contact the development team.

---

**Sahayak** - Empowering Teachers, Transforming Education 🚀