import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from app import service
from app.storage import migrate


class CampaignTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "campaign.sqlite3"
        migrate(self.path)
        _, self.learner = service.create_session(self.path)

    def state(self):
        return service.state(self.path, self.learner)

    def start(self, mission_id, mode="LEARN"):
        return service.command(self.path, self.learner, "start", {
            "command_id": str(uuid4()), "expected_revision": 0,
            "mode": mode, "mission_id": mission_id,
        })

    def submit(self, attempt, prediction, diagnosis="", aid="none"):
        return service.command(self.path, self.learner, "submit", {
            "command_id": str(uuid4()), "expected_revision": attempt["revision"],
            "attempt_id": attempt["id"],
            "response": {"prediction": prediction, "diagnosis": diagnosis, "aid_declaration": aid},
        })

    def test_campaign_starts_easy_and_locks_future_levels(self):
        progress = self.state()["course"]["campaign"]
        self.assertEqual([m["difficulty"] for m in progress], ["Tutorial", "Easy", "Medium", "Boss"])
        self.assertEqual([m["status"] for m in progress], ["unlocked", "locked", "locked", "locked"])
        self.assertEqual(progress[0]["available_modes"], ["LEARN"])
        self.assertFalse(progress[0]["requires_diagnosis"])
        self.assertFalse(progress[0]["source_enabled"])
        self.assertEqual(progress[0]["hint_count"], 1)
        self.assertIn("dumbbell", progress[0]["plain_objective"])

        with self.assertRaises(service.DomainError) as error:
            self.start("retry-02-identity")
        self.assertEqual(error.exception.code, "MISSION_LOCKED")
        self.assertEqual(error.exception.status, 403)

    def test_story_first_revision_maps_plain_scenario_to_same_assessed_mechanic(self):
        level1 = self.start("retry-01-replay")
        self.assertEqual(level1["snapshot"]["activity"]["revision"], 2)
        self.assertEqual(level1["snapshot"]["title"], "The missing receipt")
        self.assertIn("5 kg dumbbell", level1["snapshot"]["intro"])
        self.assertEqual(len(level1["snapshot"]["story"]), 5)
        self.assertIn("one charge", level1["snapshot"]["mission"]["plain_objective"])
        self.assertEqual(level1["snapshot"]["policies"]["assessment"], "trace-counts-v1")

    def test_xp_does_not_unlock_a_level_until_the_mission_is_correct(self):
        attempt = self.start("retry-01-replay")
        wrong = self.submit(attempt, "2")
        self.assertEqual(wrong["assessment"]["outcome"], "incorrect")
        self.assertEqual(wrong["reward"], 10)  # Practice XP is intentionally independent of correctness.
        progress = self.state()["course"]["campaign"]
        self.assertEqual([m["status"] for m in progress], ["unlocked", "locked", "locked", "locked"])

        retry = self.start("retry-01-replay")
        correct = self.submit(retry, "1")
        self.assertEqual(correct["assessment"]["outcome"], "correct")
        self.assertEqual(correct["assessment"]["independence"], "previously_exposed")
        self.assertEqual(correct["reward"], 0)  # Family reward was already consumed by the first attempt.
        progress = self.state()["course"]["campaign"]
        self.assertEqual([m["status"] for m in progress], ["cleared", "unlocked", "locked", "locked"])

    def test_progression_teaches_one_mechanic_then_unlocks_the_boss(self):
        level1 = self.submit(self.start("retry-01-replay"), "1")
        self.assertEqual(level1["assessment"]["total_count"], 1)
        self.assertEqual(level1["assessment"]["correct_count"], 1)

        level2 = self.start("retry-02-identity")
        self.assertEqual(level2["snapshot"]["mission"]["available_modes"], ["LEARN"])
        level2 = self.submit(level2, "2")
        self.assertEqual(level2["assessment"]["outcome"], "correct")

        level3 = self.start("retry-03-retention")
        self.assertEqual(level3["snapshot"]["mission"]["available_modes"], ["LEARN", "PAIR"])
        self.assertTrue(level3["snapshot"]["mission"]["requires_diagnosis"])
        self.assertEqual(len(level3["snapshot"]["trace"]), 2)
        source_body = {
            "command_id": str(uuid4()), "expected_revision": level3["revision"],
            "attempt_id": level3["id"],
            "response": {"prediction": "1,2", "diagnosis": "The retained record expires after the contract window.", "aid_declaration": "none"},
        }
        with self.assertRaises(service.DomainError) as error:
            service.command(self.path, self.learner, "source", source_body)
        self.assertEqual(error.exception.code, "AID_RESTRICTED")

        level3 = self.submit(level3, "1,2", "A stable intent key protects retries only while its stored result is retained.")
        self.assertEqual(level3["assessment"]["outcome"], "correct")
        progress = self.state()["course"]["campaign"]
        self.assertEqual([m["status"] for m in progress], ["cleared", "cleared", "cleared", "unlocked"])

        boss = self.start("retry-04-boss", "BUILD")
        self.assertTrue(boss["snapshot"]["mission"]["boss"])
        self.assertEqual(len(boss["snapshot"]["trace"]), 3)
        self.assertTrue(boss["worked_example"])

    def test_campaign_evidence_and_historical_phase1_activity_stay_distinct(self):
        historical = service.command(self.path, self.learner, "start", {
            "command_id": str(uuid4()), "expected_revision": 0, "mode": "LEARN",
        })
        self.assertNotIn("mission", historical["snapshot"])
        self.assertEqual(historical["snapshot"]["activity"]["revision"], 1)
        historical_family = historical["snapshot"]["family_id"]
        self.submit(historical, "2,1,2", "Persist one business-intent key across retries and define retention.")

        campaign = self.start("retry-01-replay")
        self.assertEqual(campaign["snapshot"]["activity"]["revision"], 2)
        self.assertNotEqual(campaign["snapshot"]["family_id"], historical_family)
        self.assertEqual(campaign["snapshot"]["mission"]["id"], "retry-01-replay")
        progress = self.state()["course"]["campaign"]
        self.assertEqual(progress[0]["status"], "unlocked")  # Old evidence cannot pre-clear new campaign levels.


if __name__ == "__main__":
    unittest.main()