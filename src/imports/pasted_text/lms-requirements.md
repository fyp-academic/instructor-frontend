Build a modern Learning Management System (LMS) similar to Moodle with a clean UI and scalable architecture. The system must support course management, AI insight, categories, enrollment, activities, grading, instructor/admin controls, and advanced assessment tools (quiz, assignment, workshop, H5P, SCORM, etc.).

🎯 GENERAL REQUIREMENTS
No sidebar navigation (top navigation only)

Each feature must be built as a separate page/module (modular architecture)

Clean, responsive UI (desktop-first)

Enable/disable Edit Mode globally for course editing

First-time instructor onboarding tutorial (guided walkthrough system)

Use a WYSIWYG (What You See Is What You Get) rich text editor (e.g., TinyMCE) for question creation inputs

🧭 MAIN NAVIGATION (HEADER)
Visible on all pages:

Dashboard

My Courses

AI Insights

Administration

Notifications

Messaging

Profile

Edit Mode (toggle button)

📊 DASHBOARD PAGE
Overview cards:

Total courses

Enrolled students

Recent activities

Recent courses list

Notifications panel

Quick actions (Create Course, Add Category)

📁 COURSE CATEGORY MODULE
Features:
Create category

Edit category

Delete category

Nested categories (parent-child)

Fields:
Parent Category

Category Name

Category ID Number

Description

📚 COURSE MODULE
➕ CREATE COURSE PAGE
(Keep all previously defined fields unchanged)

📄 COURSE VIEW PAGE
Header:
Course Name (title)

Navigation Tabs:

Course

Course Settings

Participants

Grades

Activities

More (dropdown)

📘 COURSE TAB (MAIN CONTENT)
Default layout:

Section 0: General

Additional sections auto-created

Each section includes:

Section title

"Add Activity or Resource" (+ button)

➕ Add Button Behavior:
Click "+" → shows:

Activity or resource

Subsection

🧩 ACTIVITY TYPES (FULL IMPLEMENTATION)
📝 QUIZ MODULE
Create Quiz Form:
Name

Description (rich editor)

Timing (open, close, time limit)

Grade settings

Attempts allowed

Layout (pagination)

Question behaviour

Review options

Appearance

Security (Safe Exam Browser)

Extra restrictions (password etc.)

Feedback (grade boundaries)

Completion conditions

After Creating Quiz:
Show: "No questions added yet"

Display "Add Question" button

Add Question Modal:
Multiple Choice

True/False

Matching

Short Answer

Numerical

Essay

Calculated

Drag & Drop

📌 QUESTION TYPES
Multiple Choice
Category

Question name

Question text (custom input UI)

Default mark

Answers (Choice 1–5)

Grade per answer

Feedback per answer

Shuffle options

Multiple answers support

Hints & penalties

True/False
Question text

Correct answer

Feedback (True/False)

Matching
Questions + Answers mapping

Minimum validation rules

📂 ASSIGNMENT MODULE
Assignment name

Description

Activity instructions

File uploads

Availability (start, due, cutoff)

Submission types (text/file)

Feedback types

Grade settings

Notifications

🔁 WORKSHOP MODULE
Peer assessment system

Submission phase + assessment phase

Grading strategies

Self-assessment

Example submissions

🎮 H5P MODULE
Upload .h5p file

Attempt tracking

Interactive content grading

💬 FORUM MODULE
Thread-based discussion system (like GitHub discussions)

Students can post questions

Replies, upvotes, moderation

🔗 URL MODULE
External link embedding

Display options

📁 FILE MODULE
File upload

Display options

Metadata (size/type/date)

📦 SCORM MODULE
Upload SCORM package

Attempt tracking

Grade calculation

Availability window

👥 PARTICIPANTS PAGE
Enroll users

Filter/search

Assign roles

📊 GRADES PAGE
Gradebook

Export

📋 ACTIVITIES PAGE
Overview of all activities

📌 MORE MENU
Reports (logs, participation)

Question bank

Competencies

Badges

Course completion

🤖 AI INSIGHTS MODULE
Student performance analysis

Engagement tracking

AI-generated suggestions

Uses GPT-o4 for:

Predicting weak students

Recommending content

Generating quiz questions

🔔 NOTIFICATIONS
Real-time alerts

💬 MESSAGING
Direct + course chat

⚙️ ADMIN MODULE
Manage users

Courses

Categories

🎓 ONBOARDING SYSTEM (NEW)
First-time instructor experience:

Step-by-step guided tutorial

Highlights:

Create course

Add section

Add activity

Create quiz

Tooltip overlays + progress steps

🧩 ADDITIONAL FEATURES
Role-based permissions

File manager

Calendar

Backup/restore

Progress tracking

Search system

🏗️ ARCHITECTURE
Frontend: React TS

Backend: Laravel API

AI: GPT-o4 integration

Modular components

🎨 UI/UX NOTES
Card-based layout

Floating "+" actions

Modal-driven workflow

Custom input components for questions

✅ EXPECTED BEHAVIOR
Course auto-generates sections

Edit mode required for changes

Activity modal appears on + click

Quiz requires adding questions after creation

Question creation uses custom UI inputs (not plain HTML)

End Goal:
A fully-featured Moodle-like LMS with advanced assessment tools, AI-powered insights, onboarding guidance, and scalable architecture.

