import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RuntimeMigrationTests(unittest.TestCase):
    def test_echo_forge_story_and_mission_route_to_real_playcanvas_backend(self):
        # Historical source remains inspectable; this test does not imply it is an
        # active player route.
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

    def test_echo_forge_keeps_asset_normalization_and_identity_in_historical_source(self):
        source = (ROOT / 'web' / 'echo-forge-world-spec.js').read_text(encoding='utf-8')
        self.assertIn("version:'pc-phase1-15'", source)
        self.assertIn("asset:'pip.robot'", source)
        self.assertIn("asset:'forge.blacksmith'", source)

    def test_historical_signal6_and_signal7_sources_remain_reviewable(self):
        adapter = (ROOT / 'web' / 'rescue-playcanvas-world.js').read_text(encoding='utf-8')
        migrate = (ROOT / 'web' / 'play-canvas-migrate.js').read_text(encoding='utf-8')
        rescue = (ROOT / 'web' / 'rescue-game.js').read_text(encoding='utf-8')
        self.assertIn("version:'pc-phase1-15'", adapter)
        self.assertIn("id:'relay-rescue.export-yard'", adapter)
        self.assertIn("surface.dataset.playCanvasBackend='playcanvas'", migrate)
        self.assertIn("function programPanel(transfer)", rescue)

    def test_active_level1_assets_are_explicitly_served_and_legacy_worlds_are_not(self):
        server = (ROOT / 'app' / 'server.py').read_text(encoding='utf-8')
        hosted = (ROOT / 'app' / 'hosted.py').read_text(encoding='utf-8')
        active = (
            'first-words.js', 'first-words-boot.js', 'first-words-world.js',
            'game-runtime.js', 'game-opening.js', 'world-spec.js',
            'playcanvas-backend.js', 'player-controls.js', 'auth-game.js',
            'playcanvas.mjs', 'quaternius-animated-robot.glb'
        )
        for asset in active:
            self.assertIn(asset, server)
            self.assertIn(asset, hosted)
        retired = (
            'echo-forge-world-spec.js', 'rescue-playcanvas-world.js',
            'play-canvas-migrate.js', 'rescue-game.js', 'expedition.js',
            'three.module.min.js', 'THREE-LICENSE.txt'
        )
        for asset in retired:
            self.assertNotIn(f"'{asset}'", server)
            self.assertNotIn(f'"{asset}"', server)
            self.assertNotIn(f"'{asset}'", hosted)
            self.assertNotIn(f'"{asset}"', hosted)
        self.assertIn('redirect("/first-words"', hosted)
        self.assertIn('return self.redirect("/first-words")', server)
        manage=(ROOT/'manage.py').read_text(encoding='utf-8')
        vendor_block=manage.split('if command == "vendor":',1)[1].split('if command == "vendor-legacy-three":',1)[0]
        self.assertNotIn('vendor_three.py',vendor_block)
        self.assertIn('vendor_playcanvas.py',vendor_block)

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

    def test_legacy_three_source_is_archival_only_and_not_active_vendor(self):
        source = (ROOT / 'web' / 'rescue-story3d.js').read_text(encoding='utf-8')
        self.assertIn("from './story3d-runtime.js'", source)
        manage=(ROOT/'manage.py').read_text(encoding='utf-8')
        self.assertIn('vendor-legacy-three',manage)
        active=manage.split('if command == "vendor":',1)[1].split('if command == "vendor-legacy-three":',1)[0]
        self.assertNotIn('vendor_three.py',active)


if __name__ == '__main__':
    unittest.main()
