# BabyAgent API Backend

This directory contains the Python FastAPI backend for the BabyAgent application. It provides APIs for tracking baby profiles, logs, reminders, and health predictions, using Supabase as the database.

## Prerequisites

- Python 3.8+
- A Supabase project ([https://supabase.com/](https://supabase.com/))
- Supabase URL and Key

## Setup

1.  **Clone the repository (if you haven't already):**

    ```bash
    # git clone <your-repo-url>
    # cd <your-repo-directory>
    ```

2.  **Install dependencies:**
    Navigate to the project root directory (where `requirements.txt` is located) and run:

    ```bash
    pip install -r requirements.txt
    ```

    _(Note: I created the `requirements.txt` file in the project root earlier.)_

3.  **Configure Environment Variables:**
    Create a `.env` file in the project root directory (alongside `requirements.txt` and the `backend` folder) with your Supabase credentials:
    ```env
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_or_service_key
    ```
    _Note: The `SUPABASE_KEY` is used here for JWT decoding within the API for simplicity in this example. In a production scenario, consider more robust JWT validation practices._

## Running the API

1.  **Start the backend service:**
    Navigate to the project root directory and run the FastAPI application using Uvicorn:

    ```bash
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Verify the backend service is running:**
    Open your web browser and navigate to `http://localhost:8000/health`. You should see a JSON response with the following structure:

    ```json
    {
      "status": "ok",
      "timestamp": "...",
      "version": "0.1.0"
    }
    ```

    If you see this response, the backend service is running correctly.

## API Endpoints Summary

| Endpoint                 | Method | Description                                      |
| ------------------------ | ------ | ------------------------------------------------ |
| /babies                  | POST   | Create a new baby profile                        |
| /babies                  | GET    | Get all baby profiles for the authenticated user |
| /babies/{baby_id}        | GET    | Get a specific baby profile                      |
| /baby_logs               | POST   | Create a new baby log entry                      |
| /baby_logs               | GET    | Get baby logs                                    |
| /reminders               | POST   | Create a new reminder                            |
| /reminders               | GET    | Get reminders                                    |
| /reminders/{reminder_id} | PATCH  | Update reminder status                           |
| /health_predictions      | POST   | Create a health prediction                       |
| /health                  | GET    | Health check                                     |

## Database Schema

Refer to the `schema.sql` file and the `supabase/migrations` directory in the project root for details on the database structure.
