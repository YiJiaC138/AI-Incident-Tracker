import json
import unittest
from main import analyze_incident

class TestAIAccuracy(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open("test_data.json", "r") as f:
            cls.test_cases = json.load(f)

    def test_incident_routing(self):
        """Test if the AI correctly analyzes and routes various incident types"""
        for case in self.test_cases:
            with self.subTest(msg=case["id"], title=case["title"]):
                print(f"\n--- Running {case['id']}: {case['title']} ---")
                
                # Directly call the AI analysis logic
                result = analyze_incident(case["title"], case["description"], case["department"])
                
                # Validate the results against our expectations
                expected = case["expected"]
                
                if "category" in expected:
                    self.assertEqual(
                        result.get("category", "").lower(), 
                        expected["category"].lower(),
                        f"Expected category {expected['category']} but got {result.get('category')}"
                    )
                
                if "priority" in expected:
                    self.assertEqual(
                        result.get("priority", "").lower(),
                        expected["priority"].lower(),
                        f"Expected priority {expected['priority']} but got {result.get('priority')}"
                    )
                
                if "assigned_team" in expected:
                    self.assertEqual(
                        result.get("assigned_team", "").lower(),
                        expected["assigned_team"].lower(),
                        f"Expected team {expected['assigned_team']} but got {result.get('assigned_team')}"
                    )
                
                print(f"Result JSON: {json.dumps(result, indent=2)}")

if __name__ == '__main__':
    unittest.main(verbosity=2)
