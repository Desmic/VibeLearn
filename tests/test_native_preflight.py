import copy
import tempfile
import unittest
from pathlib import Path

from tools.native_preflight import assess_preflight, BASE_CHECKS
from tools.supervised_native_play import supervise


def fixture_preflight(config):
    """Synthetic supervisor observations for tests only, never live evidence."""
    return dict(schema="vibelearn.native-preflight.v1",
                **{key: config["identity"][key] for key in
                   ("candidate_sha", "assignment_id", "session_id", "model")},
                checks={name: dict(status="verified", observation="Synthetic test probe")
                        for name in BASE_CHECKS | set(config["requirements"]["required_capabilities"])})


class PreflightTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.config = dict(requirements=dict(mode="native_gui", max_inputs=2,
                           required_capabilities=["screenshot", "click"], required_checkpoints=["arrival"]),
                           identity=dict(candidate_sha="candidate", assignment_id="assignment",
                                         session_id="child", model="gpt-6-astra", capabilities=["anything"]))
        self.config["preflight"] = fixture_preflight(self.config)

    def assess(self):
        return assess_preflight(self.config["requirements"], self.config["identity"], self.config["preflight"])

    def test_parent_probes_cannot_qualify_child(self):
        self.config["preflight"]["session_id"] = "parent"
        with self.assertRaisesRegex(ValueError, "session_id mismatch"):
            self.assess()

    def test_rejects_other_build_assignment_and_model(self):
        for key in ("candidate_sha", "assignment_id", "model"):
            with self.subTest(key=key):
                report = copy.deepcopy(self.config["preflight"])
                report[key] = "other"
                with self.assertRaisesRegex(ValueError, key + " mismatch"):
                    assess_preflight(self.config["requirements"], self.config["identity"], report)

    async def test_missing_provider_blocks_before_read_or_permit(self):
        self.config["preflight"]["checks"]["browser_provider"] = dict(
            status="unavailable", observation='getState: {"apps":[],"browsers":[]}')
        self.assertEqual(self.assess()["missing_checks"], ["browser_provider"])
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / "run"
            with self.assertRaisesRegex(ValueError, "preflight incomplete"):
                await supervise(self.config, root, None, lambda value: self.fail("emitted permit"))
            self.assertFalse(root.exists())

    def test_recording_is_not_media_inspection(self):
        self.config["requirements"]["review_modalities"] = ["motion_video", "audio"]
        self.config["preflight"]["checks"].update({name: dict(status="verified", observation="Test recording")
                                                 for name in ("motion_capture", "audio_capture")})
        self.assertEqual(self.assess()["missing_checks"], ["audio_inspection", "motion_inspection"])

    def test_unknown_and_absent_input_fail_closed(self):
        for status in ("unverified", "unavailable"):
            self.config["preflight"]["checks"]["visible_input_response"]["status"] = status
            self.assertFalse(self.assess()["ready"])
        del self.config["preflight"]["checks"]["visible_input_response"]
        self.assertFalse(self.assess()["ready"])

    def test_verified_without_observation_is_invalid(self):
        self.config["preflight"]["checks"]["screenshot"]["observation"] = " "
        with self.assertRaisesRegex(ValueError, "probe observation"):
            self.assess()

    def test_explicit_status_required(self):
        self.config["preflight"]["checks"]["screenshot"]["status"] = True
        with self.assertRaisesRegex(ValueError, "status must be explicit"):
            self.assess()

    def test_ready_never_grants_dispatch_or_acceptance(self):
        result = self.assess()
        self.assertTrue(result["ready"])
        self.assertEqual(result["verified_capabilities"], ["click", "screenshot"])
        self.assertFalse(result["automatic_dispatch"])
        self.assertEqual(result["product_acceptance"], "undetermined")

    async def test_legacy_config_requires_new_probe_for_new_run(self):
        del self.config["preflight"]
        with self.assertRaisesRegex(ValueError, "preflight is required"):
            await supervise(self.config, "unused", None, None)
