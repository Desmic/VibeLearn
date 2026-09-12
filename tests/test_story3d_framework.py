import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RuntimeMigrationTests(unittest.TestCase):
    def test_legacy_echo_forge_three_path_stays_shared_until_removed(self):
        source = (ROOT / 'web' / 'rescue-story3d.js').read_text(encoding='utf-8')
        self.assertIn("from './story3d-runtime.js'", source)
        self.assertIn('createThreeStoryRuntime', source)
        self.assertNotIn('new THREE.WebGLRenderer', source)
        self.assertNotIn('new ResizeObserver', source)

    def test_legacy_three_runtime_keeps_failure_and_cleanup_contract_during_migration(self):
        source = (ROOT / 'web' / 'story3d-runtime.js').read_text(encoding='utf-8')
        for contract in (
            'new THREE.WebGLRenderer',
            'ResizeObserver',
            'webglcontextlost',
            'webglcontextrestored',
            'pixelRatioCap',
            'setPaused',
            'reducedMotion',
            'dispose()',
            'createCameraRig',
        ):
            self.assertIn(contract, source)

    def test_echo_forge_story_and_mission_route_to_real_playcanvas_backend(self):
        intro = (ROOT / 'web' / 'rescue-intro.js').read_text(encoding='utf-8')
        chapter = (ROOT / 'web' / 'rescue-chapter1.js').read_text(encoding='utf-8')
        facade = (ROOT / 'web' / 'play-canvas.js').read_text(encoding='utf-8')
        runtime = (ROOT / 'web' / 'game-runtime.js').read_text(encoding='utf-8')
        adapter = (ROOT / 'web' / 'rescue-playcanvas-world.js').read_text(encoding='utf-8')
        backend = (ROOT / 'web' / 'playcanvas-backend.js').read_text(encoding='utf-8')
        world = (ROOT / 'web' / 'echo-forge-world-spec.js').read_text(encoding='utf-8')

        # Existing callers remain stable while the compatibility facade routes
        # Echo Forge onto the new engine-neutral persistent GameRuntime.
        self.assertIn("import('/play-canvas.js')", intro)
        self.assertIn('getPlayCanvas', intro)
        self.assertIn("import('/play-canvas.js')", chapter)
        self.assertIn('getPlayCanvas', chapter)
        self.assertIn("from './game-runtime.js'", facade)
        self.assertIn("from './rescue-playcanvas-world.js'", facade)
        self.assertIn("storyWorldManifest?.id==='relay-rescue.echo-forge'", facade)
        self.assertNotIn("from './story3d-world-host.js'", facade)

        # The durable path is GameRuntime -> semantic adapter/spec -> shared
        # PlayCanvas backend -> pinned actual PlayCanvas Engine module.
        self.assertIn('showStory', runtime)
        self.assertIn('showMission', runtime)
        self.assertIn("from './playcanvas-backend.js'", adapter)
        self.assertIn("from './echo-forge-world-spec.js'", adapter)
        self.assertIn("engine:'playcanvas'", adapter)
        self.assertIn("from './vendor/playcanvas.mjs'", backend)
        self.assertIn("id:'relay-rescue.echo-forge'", world)
        self.assertIn("schemaVersion:'1'", world)

    def test_playcanvas_framework_assets_are_explicitly_served(self):
        server = (ROOT / 'app' / 'server.py').read_text(encoding='utf-8')
        hosted = (ROOT / 'app' / 'hosted.py').read_text(encoding='utf-8')
        for asset in (
            'play-canvas.js', 'game-runtime.js', 'world-spec.js', 'playcanvas-backend.js',
            'echo-forge-world-spec.js', 'rescue-playcanvas-world.js', 'playcanvas.mjs',
            'PLAYCANVAS-LICENSE.txt'
        ):
            self.assertIn(asset, server)
            self.assertIn(asset, hosted)

    def test_generic_playcanvas_runtime_has_no_relay_rescue_or_three_assumptions(self):
        runtime = (ROOT / 'web' / 'game-runtime.js').read_text(encoding='utf-8')
        spec = (ROOT / 'web' / 'world-spec.js').read_text(encoding='utf-8')
        backend = (ROOT / 'web' / 'playcanvas-backend.js').read_text(encoding='utf-8')
        generic = runtime + spec + backend
        for domain_term in (
            'Pip', 'Echo Forge', 'order-01', 'bridge gear', 'rescue-01',
            'rescue-story3d', 'rescue-playcanvas-world', 'THREE.', 'story3d-world-host'
        ):
            self.assertNotIn(domain_term, generic)
        self.assertIn('validateWorldSpec', backend)
        self.assertIn('gameWorldManifest', runtime)
        self.assertIn('worldKey', runtime)


if __name__ == '__main__':
    unittest.main()
