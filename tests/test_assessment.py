import unittest
from app.assessment import evaluate, review_need, trace_effects, parse_prediction
from app.content import freeze


class AssessmentTests(unittest.TestCase):
    def test_retention_boundary_and_distinct_identity(self):
        base = {"first": "x", "retry": "x", "elapsed_seconds": 9, "retention_seconds": 10}
        self.assertEqual(trace_effects(base), 1)
        self.assertEqual(trace_effects(base | {"elapsed_seconds": 10}), 2)
        self.assertEqual(trace_effects(base | {"retry": "y"}), 2)

    def test_invalid_is_unobserved_not_a_zero_score(self):
        snapshot = freeze("LEARN")
        result = evaluate(snapshot, {"prediction": "I don't know", "diagnosis": "", "aid_declaration": "none"}, [])
        self.assertEqual(result["outcome"], "not_observed")
        self.assertIsNone(result["score"])
        for invalid in ["1,2", "1,2,3,4", "NaN,1,2", "1.5,1,2", "-1,1,2", "1e2,1,2", None]:
            self.assertIsNone(parse_prediction(invalid))

    def test_reasoning_text_does_not_determine_prediction_score(self):
        snapshot = freeze("LEARN")
        answer = {"prediction": "2,1,2", "diagnosis": "Fluent nonsense", "aid_declaration": "none"}
        result = evaluate(snapshot, answer, [])
        self.assertEqual(result["score"], 1)
        self.assertIsNone(result["reasoning"]["score"])
        self.assertEqual(result, evaluate(snapshot, answer | {"diagnosis": "idempotency retry durable atomic stable"}, []))

    def test_review_is_deterministic_and_assistance_shortens_delay(self):
        snapshot = freeze("LEARN")
        answer = {"prediction": "2,1,2", "diagnosis": "Repair", "aid_declaration": "none"}
        clean = evaluate(snapshot, answer, [])
        assisted = evaluate(snapshot, answer, ["hint"])
        self.assertEqual(review_need(snapshot, clean, "2026-09-06T00:00:00+00:00")["due_at"], "2026-09-09T00:00:00+00:00")
        self.assertEqual(review_need(snapshot, assisted, "2026-09-06T00:00:00+00:00")["due_at"], "2026-09-07T00:00:00+00:00")
