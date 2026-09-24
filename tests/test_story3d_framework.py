import tempfile
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

    def test_active_level1_assets_are_served_and_legacy_worlds_are_not(self):
        # Ask the running server instead of grepping a list: the servable set is derived
        # from the import graph of the pages it routes (app/assets.py), so there is no
        # hand-written list left to pin — and a module a page imports is served the moment
        # the page reaches it, which is exactly what a grepped list could not guarantee.
        active = (
            'first-words', 'first-words.js', 'first-words-boot.js', 'first-words.css',
            'first-words-world.js', 'preferences.js', 'game-runtime.js', 'game-opening.js',
            'tutorial-flow.js', 'experience-mode.js', 'world-marker-layout.js',
            'world-spec.js', 'playcanvas-backend.js', 'player-controls.js', 'auth-game.js',
            'game-screen.css', 'play-canvas.css', 'rescue-intro.css', 'auth-game.css',
            'vendor/playcanvas.mjs', 'assets/quaternius-animated-robot.glb',
        )
        retired = (
            'echo-forge-world-spec.js', 'rescue-playcanvas-world.js', 'play-canvas-migrate.js',
            'rescue-game.js', 'expedition.js', 'word-machine.html',
            'vendor/three.module.min.js', 'vendor/THREE-LICENSE.txt',
        )
        statuses = self._local_statuses((*active, *retired))
        for asset in active:
            self.assertEqual(200, statuses[asset], f'{asset} is not served')
        for asset in retired:
            self.assertEqual(404, statuses[asset], f'retired {asset} is still served')
        # Both servers read the one derived set; only the vendored names stay explicit.
        server = (ROOT / 'app' / 'server.py').read_text(encoding='utf-8')
        hosted = (ROOT / 'app' / 'hosted.py').read_text(encoding='utf-8')
        self.assertIn('**served_assets()', server)
        self.assertIn('served_names()', hosted)
        self.assertIn('redirect("/first-words"', hosted)
        self.assertIn('return self.redirect("/first-words")', server)
        manage=(ROOT/'manage.py').read_text(encoding='utf-8')
        vendor_block=manage.split('if command == "vendor":',1)[1].split('if command == "vendor-legacy-three":',1)[0]
        self.assertNotIn('vendor_three.py',vendor_block)
        self.assertIn('vendor_playcanvas.py',vendor_block)

    def _local_statuses(self, paths):
        import threading
        import urllib.error
        import urllib.request
        from app.server import make_server
        with tempfile.TemporaryDirectory() as tmp:
            server = make_server(Path(tmp) / 'assets.sqlite3', 0)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                base = f'http://127.0.0.1:{server.server_address[1]}'
                def status(path):
                    try:
                        with urllib.request.urlopen(base + '/' + path, timeout=10) as response:
                            return response.status
                    except urllib.error.HTTPError as error:
                        return error.code
                return {path: status(path) for path in paths}
            finally:
                server.shutdown()
                server.server_close()


    def test_active_prison_wall_leaves_a_real_gate_passage(self):
        world = (ROOT / 'web' / 'first-words-world.js').read_text(encoding='utf-8')
        self.assertNotIn("part('prison-back','box'", world)
        for segment in ('prison-back-left', 'prison-back-right', 'prison-back-top'):
            self.assertIn(segment, world)
        self.assertIn("gate('moon',[0,0,-7]", world)

    def test_reusable_gate_frame_keeps_open_portal_visually_clear(self):
        props = (ROOT / 'web' / 'rescue-world-props.js').read_text(encoding='utf-8')
        gate = props.split('export function gate(', 1)[1].split('export function tower(', 1)[0]
        self.assertIn("part('arch','box'", gate)
        self.assertNotIn("part('arch','torus'", gate)
        self.assertIn("id:id+'-door'", gate)
        self.assertIn("parent:id+'-door'", gate)

    def test_quality_system_contracts_are_runtime_backed(self):
        world_spec = (ROOT / 'web' / 'world-spec.js').read_text(encoding='utf-8')
        backend = (ROOT / 'web' / 'playcanvas-backend.js').read_text(encoding='utf-8')
        controls = (ROOT / 'web' / 'player-controls.js').read_text(encoding='utf-8')
        tutorial = (ROOT / 'web' / 'tutorial-flow.js').read_text(encoding='utf-8')
        modes = (ROOT / 'web' / 'experience-mode.js').read_text(encoding='utf-8')
        marker_layout = (ROOT / 'web' / 'world-marker-layout.js').read_text(encoding='utf-8')
        opening = (ROOT / 'web' / 'game-opening.js').read_text(encoding='utf-8')
        props = (ROOT / 'web' / 'rescue-world-props.js').read_text(encoding='utf-8')
        world = (ROOT / 'web' / 'first-words-world.js').read_text(encoding='utf-8')

        # Physicality belongs to world entities/archetypes, not only a player obstacle list.
        self.assertIn("if(entity.collider)collider(", world_spec)
        self.assertIn("_playerBlocked(", backend)
        self.assertIn("isPlayerBlocked:", backend)
        self.assertIn("collider:{shape:'box'", props)

        # Asset-backed controlled characters need explicit motion direction and the
        # backend actually consumes it instead of silently inheriting stock idle.
        self.assertIn("asset-backed player requires explicit player.animations", world_spec)
        self.assertIn("_setPlayerMoving(", backend)
        self.assertIn("animationSpeeds:{idle:0,move:1}", world)

        # Major semantic objects and cinematic events carry machine-checkable intent.
        self.assertIn("major object needs at least two readability channels", world_spec)
        self.assertIn("export function capabilityModule", props)
        self.assertIn("directionVersion:'1'", world)
        self.assertIn("Major opening event needs at least four coordinated channels", opening)
        self.assertIn("Visible antagonist action needs cause.entity", opening)

        # Tutorial progression, state-driven interaction teaching and mode
        # exclusivity are reusable runtime contracts; package data supplies content.
        self.assertIn("export function createTutorialFlow", tutorial)
        self.assertIn("export function selectStateTutorialStep", tutorial)
        self.assertIn("export function tutorialStepSucceeded", tutorial)
        self.assertIn("export function createExperienceModeController", modes)
        self.assertIn("export function placeWorldMarker", marker_layout)
        self.assertIn("critical=false", marker_layout)
        self.assertNotIn("createTutorialFlow", controls)
        self.assertIn("export const controlTutorialSpec", world)
        self.assertIn("export const speechRepairTutorialSpec", world)
        self.assertIn("skill:'move protagonist'", world)
        self.assertIn("success:'protagonist position changed'", world)
        self.assertIn("id:'connect',stage:'TUTORIAL · REPAIR 1/4'", world)
        self.assertIn("id:'speak',stage:'TUTORIAL · REPAIR 4/4'", world)

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
