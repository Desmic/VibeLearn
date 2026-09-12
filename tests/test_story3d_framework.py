import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RuntimeMigrationTests(unittest.TestCase):
    def test_echo_forge_story_and_mission_route_to_real_playcanvas_backend(self):
        intro = (ROOT / 'web' / 'rescue-intro.js').read_text(encoding='utf-8')
        chapter = (ROOT / 'web' / 'rescue-chapter1.js').read_text(encoding='utf-8')
        adapter = (ROOT / 'web' / 'rescue-playcanvas-world.js').read_text(encoding='utf-8')
        runtime = (ROOT / 'web' / 'game-runtime.js').read_text(encoding='utf-8')
        backend = (ROOT / 'web' / 'playcanvas-backend.js').read_text(encoding='utf-8')
        for source in (intro, chapter):
            self.assertIn("import('/game-runtime.js')", source)
            self.assertIn("import('/rescue-playcanvas-world.js')", source)
            self.assertNotIn("import('/rescue-story3d.js')", source)
            self.assertNotIn("import('/play-canvas.js')", source)
        self.assertIn("engine:'playcanvas'", adapter)
        self.assertIn('createPlayCanvasWorld', adapter)
        self.assertIn('class GameRuntimeController', runtime)
        self.assertIn("import * as pc from './vendor/playcanvas.mjs'", backend)
        # PlayCanvas owns data-engine internally; VibeLearn uses a namespaced,
        # stable marker rather than depending on engine implementation metadata.
        self.assertIn("dataset.vibelearnEngine='playcanvas'", backend)
        self.assertIn("PLAYCANVAS_ENGINE_VERSION='2.22.1'", backend)
        # A healthy generic backend instance must advertise readiness directly;
        # adapters and the engine-neutral runtime must not infer it from stats().
        self.assertIn('this.available=true', backend)
        self.assertIn('this.available=false', backend)
        self.assertIn('available:this.available', backend)

    def test_generic_playcanvas_runtime_has_no_relay_rescue_or_three_assumptions(self):
        runtime = (ROOT / 'web' / 'game-runtime.js').read_text(encoding='utf-8')
        backend = (ROOT / 'web' / 'playcanvas-backend.js').read_text(encoding='utf-8')
        world_spec = (ROOT / 'web' / 'world-spec.js').read_text(encoding='utf-8')
        generic = runtime + backend + world_spec
        for domain_term in ('Pip', 'Echo Forge', 'order-01', 'bridge gear', 'rescue-01'):
            self.assertNotIn(domain_term, generic)
        for legacy_term in ('story3d-runtime.js', 'story3d-world-host.js', 'rescue-story3d.js', 'THREE.'):
            self.assertNotIn(legacy_term, generic)

    def test_playcanvas_framework_assets_are_explicitly_served(self):
        server = (ROOT / 'app' / 'server.py').read_text(encoding='utf-8')
        hosted = (ROOT / 'app' / 'hosted.py').read_text(encoding='utf-8')
        for asset in (
            'game-runtime.js', 'world-spec.js', 'playcanvas-backend.js',
            'echo-forge-world-spec.js', 'rescue-playcanvas-world.js'
        ):
            self.assertIn(asset, server)
            self.assertIn(asset, hosted)
        self.assertIn('playcanvas.mjs', server)
        self.assertIn('playcanvas.mjs', hosted)

    def test_legacy_echo_forge_three_path_stays_shared_until_removed(self):
        source = (ROOT / 'web' / 'rescue-story3d.js').read_text(encoding='utf-8')
        self.assertIn("from './story3d-runtime.js'", source)
        self.assertIn('createThreeStoryRuntime', source)
        self.assertNotIn('new THREE.WebGLRenderer', source)
        self.assertNotIn('new ResizeObserver', source)

    def test_legacy_three_runtime_keeps_failure_and_cleanup_contract_during_migration(self):
        source = (ROOT / 'web' / 'story3d-runtime.js').read_text(encoding='utf-8')
        for contract in (
            'new THREE.WebGLRenderer', 'ResizeObserver', 'webglcontextlost',
            'webglcontextrestored', 'setPaused', 'reducedMotion', 'dispose()'
        ):
            self.assertIn(contract, source)


if __name__ == '__main__':
    unittest.main()
