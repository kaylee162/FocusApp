# Focus App

## Overview

Focus App is a Flask-based web application designed to help users build habits, track goals, and stay productive. It combines a goal tracker, daily planner, and focus timer into one clean, retro-inspired interface.

---

## Features

* **Goal Tracking**

  * Create, edit, and delete goals
  * Supports one-time, daily, weekly, and monthly goals
  * Progress tracking with completion states

* **Daily Planner**

  * Drag-and-drop task prioritization
  * Mark tasks as complete or remove them

* **Focus Timer**

  * Adjustable countdown timer
  * Modal-based focus mode for distraction-free sessions

* **Weekly Progress**

  * Visual chart showing completed goals over time

* **Authentication**

  * User signup, login, and logout
  * Secure session handling

---

## Tech Stack

* **Backend:** Flask (Python)
* **Frontend:** HTML, CSS, JavaScript
* **Database:** SQLite (via SQLAlchemy)
* **Forms:** Flask-WTF
* **Charts:** Chart.js

---

## Project Structure

```
focus-app/
├── app.py
├── models.py
├── forms.py
├── routes/
│   ├── auth.py
│   ├── main.py
│   ├── tasks.py
├── templates/
├── static/
│   ├── css/style.css
│   ├── js/scripts.js
│   └── images/
```

---

## How It Works

* Users authenticate through Flask routes and sessions
* Goals are stored in the database and filtered per user
* Recurring goals reset based on their frequency (daily, weekly, monthly)
* The dashboard pulls:

  * active goals
  * completed goals
  * prioritized tasks
* JavaScript handles:

  * drag-and-drop tasks
  * timer behavior
  * chart rendering

---

## Running the App Locally

### 1. Clone the Repository

```bash
git clone https://github.com/kaylee162/focus-app.git
cd focus-app
```

---

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

---

### 3. Activate the Virtual Environment

#### Windows (PowerShell)

```powershell
.\venv\Scripts\Activate.ps1
```

#### Windows (Command Prompt)

```cmd
venv\Scripts\activate.bat
```

#### macOS / Linux

```bash
source venv/bin/activate
```

---

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 5. Run the Application

```bash
python app.py
```

Or with Flask:

```bash
flask --app app run --debug
```

---

### 6. Open the App

Open your browser and go to:

```txt
http://127.0.0.1:5000
```

---

## Future Usage

After the initial setup, you only need to:

```powershell
cd your-project-folder
.\venv\Scripts\Activate.ps1
python app.py
```

---

## Stopping the App

Press:

```txt
CTRL + C
```

inside the terminal.

---

## Deactivating the Virtual Environment

```bash
deactivate
```

---

## Notes

If PowerShell blocks script execution when activating the virtual environment, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then type:

```txt
Y
```

and press Enter.

## Design Notes

* Retro-inspired UI with soft colors and rounded components
* Playful visuals (stickers, doodles, badges)
* Focus on clarity, friendliness, and usability

---

## Future Improvements

* Notifications / reminders
* Streak tracking
* Mobile optimization
* Dark mode toggle

---

## Demo Talking Points

* “This app combines habit tracking, planning, and focus into one system.”
* “Recurring goals automatically reset based on frequency.”
* “The planner uses drag-and-drop for prioritization.”
* “The UI is designed to feel fun and motivating, not overwhelming.”

---
