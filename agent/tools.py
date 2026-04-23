import json

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
    keyword = keyword.lower()
    if "payroll" in keyword:
        return json.dumps({
            "related_tickets": 3,
            "status": "A known active major incident is currently being investigated by the Database Engineering team."
        })
    return json.dumps({
        "related_tickets": 0,
        "status": "No similar recent tickets found."
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
