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
        self.assertIn("version:'pc-phase1-11'", source)
        self.assertIn("transform:{position:[0,-.08,0],scale:[.52,.52,.52]}", source)
        self.assertIn('Measured source mesh height is ~4.63 units', source)
        fallback_block = source.split('const PIP_FALLBACK=[', 1)[1].split('];', 1)[0]
        self.assertNotIn('pip-scarf', fallback_block)
        self.assertNotIn('pip-beacon', fallback_block)
        self.assertIn("child('pip-scarf'", source)
        self.assertIn("child('pip-beacon'", source)
        self.assertIn("asset:'pip.robot'", source)
        self.assertIn("animation:'idle'", source)
        self.assertIn("asset:'forge.blacksmith'", source)
        self.assertIn("src:'/assets/quaternius-blacksmith.glb'", source)
        self.assertIn("transform:{position:[.8076,.0051,.0210],scale:[1.30,1.30,1.30]}", source)
        forge_fallback = source.split('const FORGE_FALLBACK=[', 1)[1].split('];', 1)[0]
        for structural_id in ('forge-body','forge-roof','forge-window-l','forge-window-r','forge-chimney','forge-chimney-cap','forge-pipe','forge-door'):
            self.assertIn(structural_id, forge_fallback)
        for semantic_overlay in ('forge-furnace','forge-sign','forge-gear-a','forge-gear-b','forge-door-glow','forge-smoke-1','forge-smoke-2'):
            self.assertNotIn(semantic_overlay, forge_fallback)

    def test_signal6_route_is_spatialized_over_world_and_drives_storm_feedback(self):
        adapter = (ROOT / 'web' / 'rescue-playcanvas-world.js').read_text(encoding='utf-8')
        css = (ROOT / 'web' / 'play-canvas.css').read_text(encoding='utf-8')
        migrate = (ROOT / 'web' / 'play-canvas-migrate.js').read_text(encoding='utf-8')
        self.assertIn("version:'pc-phase1-11'", adapter)
        self.assertIn("'storm-route-feedback'", adapter)
        self.assertIn("const routeTested=level===6", adapter)
        self.assertIn("patch.camera='mission.choice'", adapter)
        self.assertIn("patch.show.push('storm-bolt-a','storm-bolt-b')", adapter)
        self.assertIn("routeTested:Boolean", adapter)
        for contract in (
            '.play-canvas-route-circuit{inset:0!important',
            '.play-canvas-route-nodes{position:absolute!important',
            '.play-canvas-toolbelt{position:absolute!important',
            '.play-canvas-route-run{position:absolute!important',
            '.play-canvas-storm-outcome{position:absolute!important',
            '.play-canvas-route-playback{position:absolute!important',
        ):
            self.assertIn(contract, css)
        self.assertIn('top:40%!important', css)
        self.assertIn('overflow-x:auto!important', css)
        self.assertIn("const playback=root.querySelector('.rg-live-route')", migrate)
        self.assertIn("playback.classList.add('play-canvas-route-playback')", migrate)
        self.assertIn('if(playback.parentElement!==hud)hud.append(playback)', migrate)
        self.assertIn('.play-canvas-storm-outcome .rg-case-detail{display:none!important}', css)

    def test_world_composition_anchors_seven_lights_and_portrait_cameras(self):
        source = (ROOT / 'web' / 'echo-forge-world-spec.js').read_text(encoding='utf-8')
        self.assertIn('const distantBeaconScale={1:.72,2:.56,3:.66,5:.54,6:.58}', source)
        self.assertIn("add(`beacon-island-${i}-rock`", source)
        self.assertIn("add(`beacon-island-${i}-top`", source)
        self.assertIn("emissiveIntensity:.85", source)
        self.assertIn("portrait:{position:[.2,2.35,19.2],lookAt:[.3,.45,.7],fov:48}", source)
        self.assertIn("portrait:{position:[4.4,2.4,10.2],lookAt:[5.0,.85,.6],fov:46}", source)
        self.assertIn("portrait:{position:[4.2,2.45,10.4],lookAt:[5.0,.9,.7],fov:45}", source)
        self.assertIn("portrait:{position:[4.4,2.25,9.8],lookAt:[5.0,.8,.8],fov:44}", source)

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
