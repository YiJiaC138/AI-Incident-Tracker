import sqlite3
import unittest
from datetime import datetime, timedelta

class TestDBLogic(unittest.TestCase):
    def setUp(self):
        # Use an in-memory database for testing
        self.conn = sqlite3.connect(":memory:")
        self.cursor = self.conn.cursor()
        
        # Initialize the schema
        self.cursor.execute('''
            CREATE TABLE tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                reporter_department TEXT,
                summary TEXT,
                category TEXT,
                priority TEXT,
                assigned_team TEXT,
                status TEXT,
                created_at TIMESTAMP,
                related_tickets TEXT
            )
        ''')
        self.conn.commit()

    def tearDown(self):
        self.conn.close()

    def test_ticket_creation(self):
        """Test inserting a new ticket into the database"""
        created_at = datetime.utcnow().isoformat()
        
        self.cursor.execute('''
            INSERT INTO tickets (title, description, reporter_department, summary, category, priority, assigned_team, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "Test Ticket", 
            "Test Description", 
            "Engineering", 
            "A test summary", 
            "software", 
            "low", 
            "Test Team", 
            "Open", 
            created_at
        ))
        
        ticket_id = self.cursor.lastrowid
        self.conn.commit()
        
        self.assertIsNotNone(ticket_id, "Ticket ID should not be None after insertion")
        
        # Retrieve the ticket
        self.cursor.execute('SELECT * FROM tickets WHERE id = ?', (ticket_id,))
        ticket = self.cursor.fetchone()
        
        self.assertIsNotNone(ticket, "Ticket should exist in the database")
        self.assertEqual(ticket[1], "Test Ticket", "Title should match")
        self.assertEqual(ticket[8], "Open", "Status should be Open")

    def test_escalation_logic(self):
        """Test escalating tickets older than the threshold"""
        # Create an old ticket (6 minutes ago)
        old_time = (datetime.utcnow() - timedelta(minutes=6)).isoformat()
        self.cursor.execute('''
            INSERT INTO tickets (title, status, assigned_team, created_at)
            VALUES (?, ?, ?, ?)
        ''', ("Old Ticket", "Open", "IT Support", old_time))
        
        # Create a new ticket (1 minute ago)
        new_time = (datetime.utcnow() - timedelta(minutes=1)).isoformat()
        self.cursor.execute('''
            INSERT INTO tickets (title, status, assigned_team, created_at)
            VALUES (?, ?, ?, ?)
        ''', ("New Ticket", "Open", "IT Support", new_time))
        self.conn.commit()
        
        # Run the escalation logic (threshold: 5 minutes)
        threshold_time = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        self.cursor.execute('''
            UPDATE tickets 
            SET status = 'Escalated', assigned_team = assigned_team || ' (Manager)'
            WHERE status = 'Open' AND created_at < ?
        ''', (threshold_time,))
        
        escalated_count = self.cursor.rowcount
        self.conn.commit()
        
        # We expect exactly 1 ticket to be escalated
        self.assertEqual(escalated_count, 1, "Only one ticket should be escalated")
        
        # Verify the old ticket was escalated
        self.cursor.execute('SELECT status, assigned_team FROM tickets WHERE title = "Old Ticket"')
        old_ticket = self.cursor.fetchone()
        self.assertEqual(old_ticket[0], "Escalated", "Old ticket status should be Escalated")
        self.assertEqual(old_ticket[1], "IT Support (Manager)", "Old ticket team should have Manager appended")
        
        # Verify the new ticket was NOT escalated
        self.cursor.execute('SELECT status, assigned_team FROM tickets WHERE title = "New Ticket"')
        new_ticket = self.cursor.fetchone()
        self.assertEqual(new_ticket[0], "Open", "New ticket status should still be Open")
        self.assertEqual(new_ticket[1], "IT Support", "New ticket team should remain unchanged")

if __name__ == '__main__':
    unittest.main(verbosity=2)
