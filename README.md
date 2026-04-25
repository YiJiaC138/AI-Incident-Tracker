# AI-Incident Tracker MVP

🎥 **[Watch the Presentation Pitch Video Here](presentation/PresentationPitch.mp4)**  
*(Alternate Google Drive Link: [Watch on Google Drive](https://drive.google.com/file/d/1IXF7IEKgUNP-nRn4BcAkM7FQ1Xq98NE3/view?usp=drive_link))*

AI-Incident Tracker is an AI-powered ticket orchestration platform that automates the intake, classification, routing, and escalation of incident reports. It utilizes a React frontend (Vite) and a FastAPI Python backend, powered by the Z.AI GLM LLM as the core reasoning engine.

## Advanced AI Features Implemented

1. **Structured Outputs**: The backend forces the AI to output responses in strict JSON format (using `response_format={"type": "json_object"}`). This guarantees that the AI always returns exact keys (`summary`, `category`, `priority`, `assigned_team`), eliminating string parsing errors.
2. **Context Caching (Knowledge Base)**: The system utilizes a robust external Knowledge Base (`agent/knowledge_base.txt`) injected into the prompt. The AI acts strictly according to enterprise policies (e.g. knowing that executives get critical priority, and networking issues go to the NOC) rather than relying on generalized guessing.
3. **Function Calling / Agentic Tool Use**: The AI acts as an autonomous agent. If a user reports an issue (e.g., "payroll is down"), the AI can call internal backend tools (`check_server_status` and `query_past_tickets` in `agent/tools.py`) to verify the real-time status of the servers before it finalizes its triage output.
4. **Multi-Turn Reasoning**: The `analyze_incident` endpoint handles multi-turn agentic loops. The AI decides to call a tool, the backend runs the tool and returns the response to the AI, and then the AI uses that real-time data to generate the final incident report.

## Project Structure

- **`src/`**: React Frontend built with Vite, Tailwind CSS, `lucide-react`, and `react-router-dom`. Uses Axios for RESTful API communication.
- **`agent/`**: FastAPI Backend built with Python, SQLite, and `zai-sdk`.
  - `main.py`: Core FastAPI endpoints and AI loop logic.
  - `tools.py`: Available functions the AI can call autonomously.
  - `knowledge_base.txt`: The enterprise routing rules.
  - `test_ai_logic.py`: AI accuracy test suite.
  - `test_db_logic.py`: Raw SQLite test suite.
- **`docs/`**: Contains project documentation and architecture details.
- **`presentation/`**: Contains the presentation pitch deck and video.

---

## Getting Started: Running Locally

### 1. Backend Setup

You need Python 3.9+ installed. 

Navigate to the `agent` directory:
```bash
cd AI-IncidentTracker/agent
```

Create a virtual environment and activate it:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install the required Python dependencies:
```bash
pip install fastapi uvicorn pydantic python-dotenv zai-sdk
```

Create a `.env` file in the `agent` directory with your Zhipu AI API Key:
```env
ZAI_API_KEY=your_api_key_here
```

Run the FastAPI server:
```bash
python main.py
```
The API will run on `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the project root directory.

```bash
cd AI-IncidentTracker
```

Install the Node dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`. 

---

## MVP Usage Flow

1. Open `http://localhost:5173` in your browser.
2. Fill out an incident report using either the "Support Portal" or "Simulated Email" tab. *Try entering something like "The payroll server is down" to watch the AI trigger its tools!*
3. Click "Submit Incident". The request is sent to the backend, processed by the AI, and stored in the SQLite database.
4. Navigate to the "Dashboard" tab (top right) to see the newly created ticket.
5. Click "Trigger SLA Escalations" to simulate a background job that escalates unresolved tickets older than 5 minutes.

---

## Running the Automated Tests

To verify the AI's accuracy and the backend's database logic without spinning up the server, you can run the test suites located in the `agent/` folder.

```bash
cd AI-IncidentTracker/agent
# Test the raw SQLite ticket creation and escalation logic
python test_db_logic.py

# Test the AI's accuracy and routing logic against the knowledge base
python test_ai_logic.py
```