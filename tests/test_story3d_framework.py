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
        self.assertIn("dataset.vibelearnEngine='playcanvas'", backend)
        self.assertIn("PLAYCANVAS_ENGINE_VERSION='2.22.1'", backend)
        self.assertIn('this.available=true', backend)
        self.assertIn('this.available=false', backend)
        self.assertIn('available:this.available', backend)

    def test_generic_playcanvas_runtime_has_no_relay_rescue_or_three_assumptions(self):
        runtime = (ROOT / 'web' / 'game-runtime.js').read_text(encoding='utf-8')
        backend = (ROOT / 'web' / 'playcanvas-backend.js').read_text(encoding='utf-8')
        world_spec = (ROOT / 'web' / 'world-spec.js').read_text(encoding='utf-8')
        generic = runtime + backend + world_spec
        for domain_term in ('Pip', 'Echo Forge', 'order-01', 'bridge gear', 'rescue-01', 'Quaternius', 'Animated Robot'):
            self.assertNotIn(domain_term, generic)
        for legacy_term in ('story3d-runtime.js', 'story3d-world-host.js', 'rescue-story3d.js', 'THREE.'):
            self.assertNotIn(legacy_term, generic)
        self.assertIn("asset.resource.instantiateRenderEntity", backend)
        self.assertIn("_measureAssetBounds", backend)
        self.assertIn("assetBounds:Object.fromEntries", backend)
        self.assertIn("value?.resource||value", backend)
        self.assertIn("state.animations", world_spec)
        self.assertIn("safe same-origin root path", world_spec)

    def test_echo_forge_keeps_asset_normalization_and_identity_in_world_spec(self):
        source = (ROOT / 'web' / 'echo-forge-world-spec.js').read_text(encoding='utf-8')
        self.assertIn("version:'pc-phase1-8'", source)
        self.assertIn("transform:{position:[0,-.08,0],scale:[.52,.52,.52]}", source)
        self.assertIn('Measured source mesh height is ~4.63 units', source)
        fallback_block = source.split('const PIP_FALLBACK=[', 1)[1].split('];', 1)[0]
        self.assertNotIn('pip-scarf', fallback_block)
        self.assertNotIn('pip-beacon', fallback_block)
        self.assertIn("child('pip-scarf'", source)
        self.assertIn("child('pip-beacon'", source)
        self.assertIn("asset:'pip.robot'", source)
        self.assertIn("animation:'idle'", source)

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
        for asset in (
            'quaternius-animated-robot.glb', 'QUATERNIUS-ANIMATED-ROBOT-LICENSE.txt',
            'quaternius-blacksmith.glb', 'QUATERNIUS-BLACKSMITH-LICENSE.txt'
        ):
            self.assertIn(asset, server)
            self.assertIn(asset, hosted)
        self.assertIn('model/gltf-binary', server)

    def test_game_asset_vendor_is_pinned_and_verified(self):
        vendor = (ROOT / 'tools' / 'vendor_game_assets.py').read_text(encoding='utf-8')
        manage = (ROOT / 'manage.py').read_text(encoding='utf-8')
        self.assertIn('0062ceaa6dd8cda2d2b69cbcc5f80724928543bf', vendor)
        self.assertIn('8784b36b4a174bfc89a31150b39f1d4fd1853dfa', vendor)
        self.assertIn('401_024', vendor)
        self.assertIn('Public Domain', vendor)
        self.assertIn('425e0b90b9e151a9f04d83f82ba37439df5c080f', vendor)
        self.assertIn('83917c55b132d8e51e6c2b969911e14c857956a8', vendor)
        self.assertIn('670_832', vendor)
        self.assertIn('quaternius-blacksmith.glb', vendor)
        self.assertIn('CC0 1.0', vendor)
        self.assertIn("tools/vendor_game_assets.py", manage)
        self.assertIn('def _git_blob_sha1', vendor)
        self.assertIn('header = f"blob {len(data)}\\0".encode("ascii")', vendor)
        self.assertIn('hashlib.sha1(header + data).hexdigest()', vendor)
        self.assertIn('robot[:4] != b"glTF"', vendor)

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
