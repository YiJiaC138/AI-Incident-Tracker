import os
import json
import sqlite3
from datetime import datetime, timedelta
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from zai import ZaiClient
from tools import AVAILABLE_TOOLS_SCHEMA, TOOL_DISPATCHER

load_dotenv()

app = FastAPI(title="AI-Incident Tracker API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "tickets.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            reporter_department TEXT,
            summary TEXT,
            category TEXT,
            priority TEXT,
            assigned_team TEXT,
            status TEXT,
            created_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

# Initialize Z.AI client
api_key = os.getenv("ZAI_API_KEY")
if not api_key:
    print("Warning: ZAI_API_KEY not found in .env file. AI routing will fail.")

client = ZaiClient(api_key=api_key or "DUMMY", base_url="https://api.ilmu.ai/v1")

class IncidentRequest(BaseModel):
    title: str
    description: str
    department: str

def analyze_incident(title: str, description: str, department: str) -> dict:
    try:
        with open("knowledge_base.txt", "r") as f:
            kb = f.read()
    except FileNotFoundError:
        kb = "No specific routing rules available. Route to General IT Support."

    system_prompt = f"""
You are an AI IT incident triage assistant with advanced reasoning capabilities.
Analyze the user's incident report.
Use the provided tools if you need to check if a server/service is currently online or if there is a known major incident.
You MUST adhere to the following IT Routing Policy Knowledge Base strictly:

<KNOWLEDGE_BASE>
{kb}
</KNOWLEDGE_BASE>

Regardless of whether you use tools or not, your final response MUST be a valid JSON object representing the triage output with EXACTLY these keys:
"summary": "A concise summary of the issue, including context from any tools used.",
"category": "e.g., software, hardware, network, access",
"priority": "low, medium, high, or critical",
"assigned_team": "The exact team name from the knowledge base"
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Title: {title}\nDescription: {description}\nReporter Department: {department}"}
    ]

    try:
        # 1. First call with tools enabled
        # Notice we also pass response_format to ensure the model outputs JSON if it doesn't call a tool
        response = client.chat.completions.create(
            model="ilmu-glm-5.1",
            messages=messages,
            tools=AVAILABLE_TOOLS_SCHEMA,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        response_message = response.choices[0].message
        
        # 2. Check if the model wants to call tools
        # We need to handle tool_calls safely as some clients return None or empty lists
        if hasattr(response_message, "tool_calls") and response_message.tool_calls:
            # Safely append the response message dict
            messages.append(response_message.model_dump() if hasattr(response_message, "model_dump") else {"role": "assistant", "content": response_message.content, "tool_calls": [{"id": t.id, "type": t.type, "function": {"name": t.function.name, "arguments": t.function.arguments}} for t in response_message.tool_calls]})
            
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_to_call = TOOL_DISPATCHER.get(function_name)
                
                if function_to_call:
                    args_string = tool_call.function.arguments or "{}"
                    function_args = json.loads(args_string)
                    tool_result = function_to_call(**function_args)
                    
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": tool_result,
                    })
            
            # 3. Second call to get final JSON after tools have run
            response = client.chat.completions.create(
                model="ilmu-glm-5.1",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.1
            )
            response_message = response.choices[0].message
            
        content = response_message.content
        
        # Safely clean up if the model still wrapped it in markdown
        if content:
            content = content.replace("```json", "").replace("```", "").strip()
            if not content:
                raise ValueError("AI response content was empty after stripping markdown")
            return json.loads(content)
        else:
            raise ValueError("Empty response from AI")
            
    except Exception as e:
        print(f"Error during AI analysis: {e}")
        # Fallback values if AI fails
        return {
            "summary": "Failed to analyze incident automatically due to an internal error.",
            "category": "Unknown",
            "priority": "medium",
            "assigned_team": "Pending Manual Review"
        }

@app.post("/api/incidents")
async def create_incident(req: IncidentRequest):
    analysis = analyze_incident(req.title, req.description, req.department)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    status = "Open"
    
    cursor.execute('''
        INSERT INTO tickets (title, description, reporter_department, summary, category, priority, assigned_team, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (req.title, req.description, req.department, analysis.get('summary'), analysis.get('category'), analysis.get('priority'), analysis.get('assigned_team'), status, created_at))
    
    ticket_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": ticket_id, "status": "success", "analysis": analysis}

@app.get("/api/tickets")
async def get_tickets():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tickets ORDER BY created_at DESC')
    tickets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tickets

@app.post("/api/escalate")
async def trigger_escalation():
    # Escalate tickets that have been open for more than 5 minutes (for hackathon demo purposes)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    threshold_time = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
    
    cursor.execute('''
        UPDATE tickets 
        SET status = 'Escalated', assigned_team = assigned_team || ' (Manager)'
        WHERE status = 'Open' AND created_at < ?
    ''', (threshold_time,))
    
    escalated_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    return {"status": "success", "escalated_count": escalated_count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
