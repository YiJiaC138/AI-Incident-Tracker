import json
import sqlite3
import os

def check_server_status(server_name: str) -> str:
    """
    Checks the real-time status of a server or service (e.g., payroll, email, sap).
    """
    server_name = server_name.lower()
    if "payroll" in server_name:
        return json.dumps({
            "server": server_name,
            "status": "down",
            "uptime": "0%",
            "error": "Database connection timeout",
            "eta_resolution": "Unknown"
        })
    elif "email" in server_name or "exchange" in server_name:
        return json.dumps({
            "server": server_name,
            "status": "degraded",
            "uptime": "85%",
            "error": "High latency in delivery",
            "eta_resolution": "30 minutes"
        })
    return json.dumps({
        "server": server_name,
        "status": "online",
        "uptime": "99.9%",
        "error": None
    })

def query_past_tickets(keyword: str) -> str:
    """
    Searches the ticket database for recent similar incidents.
    """
    search_keyword = f"%{keyword.lower()}%"
    db_path = "tickets.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, status, assigned_team 
            FROM tickets 
            WHERE lower(title) LIKE ? 
               OR lower(description) LIKE ? 
               OR lower(summary) LIKE ?
            ORDER BY created_at DESC
            LIMIT 5
        ''', (search_keyword, search_keyword, search_keyword))
        
        results = cursor.fetchall()
        conn.close()
        
        if not results:
            return json.dumps({
                "related_tickets": 0,
                "status": "No similar recent tickets found.",
                "tickets": []
            })
            
        formatted_tickets = [
            {"id": row[0], "title": row[1], "status": row[2], "assigned_team": row[3]} 
            for row in results
        ]
            
        return json.dumps({
            "related_tickets": len(results),
            "status": f"Found {len(results)} related tickets.",
            "tickets": formatted_tickets
        })
        
    except sqlite3.Error as e:
        return json.dumps({
            "error": f"Database error: {str(e)}"
        })

# Define the tools schema for the Z.AI / OpenAI API
AVAILABLE_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "check_server_status",
            "description": "Check the real-time status of a server or service (e.g., 'payroll', 'email'). Call this when the user reports a specific service is inaccessible or slow.",
            "parameters": {
                "type": "object",
                "properties": {
                    "server_name": {
                        "type": "string",
                        "description": "The name of the server or service to check."
                    }
                },
                "required": ["server_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_past_tickets",
            "description": "Search the database for recent tickets related to a keyword to see if there is an ongoing major incident.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "The keyword to search for, e.g., 'payroll', 'login'."
                    }
                },
                "required": ["keyword"]
            }
        }
    }
]

# Dispatcher mapping tool names to actual Python functions
TOOL_DISPATCHER = {
    "check_server_status": check_server_status,
    "query_past_tickets": query_past_tickets
}
