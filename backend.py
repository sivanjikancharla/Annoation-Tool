from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json

app = FastAPI()

# Allow the Frontend to talk to the Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Setup ---
def init_db():
    conn = sqlite3.connect('annotations.db')
    cursor = conn.cursor()
    # Create table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            data TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Data Model ---
class AnnotationData(BaseModel):
    filename: str
    annotations: list

# --- API Endpoints ---

@app.post("/save")
async def save_annotations(item: AnnotationData):
    try:
        conn = sqlite3.connect('annotations.db')
        cursor = conn.cursor()
        # Convert list to JSON string for storage
        json_data = json.dumps(item.annotations)
        
        # Upsert: Update if exists, otherwise insert
        cursor.execute('''
            INSERT INTO projects (filename, data) VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET data=excluded.data
        ''', (item.filename, json_data))
        
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Saved to annotations.db"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/load/{filename}")
async def load_annotations(filename: str):
    conn = sqlite3.connect('annotations.db')
    cursor = conn.cursor()
    cursor.execute('SELECT data FROM projects WHERE filename = ?', (filename,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {"annotations": json.loads(row[0])}
    return {"annotations": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
