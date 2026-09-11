import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Story3DFrameworkTests(unittest.TestCase):
    def test_echo_forge_uses_shared_runtime_not_its_own_renderer(self):
        source = (ROOT / 'web' / 'rescue-story3d.js').read_text(encoding='utf-8')
        self.assertIn("from './story3d-runtime.js'", source)
        self.assertIn('createThreeStoryRuntime', source)
        self.assertNotIn('new THREE.WebGLRenderer', source)
        self.assertNotIn('new ResizeObserver', source)
        self.assertNotIn('currentCam', source)
        self.assertNotIn('currentLook', source)

    def test_runtime_owns_renderer_lifecycle_and_fallback_hooks(self):
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
            'data-story3d-runtime',
            'createCameraRig',
            'portraitMaxAspect',
            'responsiveness',
        ):
            self.assertIn(contract, source)

    def test_story_and_mission_mount_through_versioned_world_host(self):
        intro = (ROOT / 'web' / 'rescue-intro.js').read_text(encoding='utf-8')
        chapter = (ROOT / 'web' / 'rescue-chapter1.js').read_text(encoding='utf-8')
        host = (ROOT / 'web' / 'story3d-world-host.js').read_text(encoding='utf-8')
        adapter = (ROOT / 'web' / 'rescue-story3d.js').read_text(encoding='utf-8')
        self.assertIn("import('/story3d-world-host.js')", intro)
        self.assertIn('mountStoryWorldModule', intro)
        self.assertIn("import('/story3d-world-host.js')", chapter)
        self.assertIn('mountStoryWorldModule', chapter)
        self.assertIn('STORY3D_ADAPTER_VERSION', host)
        self.assertIn('validateStoryWorldModule', host)
        self.assertIn('storyWorldManifest', adapter)
        self.assertIn('adapterVersion:STORY3D_ADAPTER_VERSION', adapter)

    def test_story3d_framework_assets_are_explicitly_served(self):
        server = (ROOT / 'app' / 'server.py').read_text(encoding='utf-8')
        hosted = (ROOT / 'app' / 'hosted.py').read_text(encoding='utf-8')
        for asset in ('story3d-runtime.js', 'story3d-world-host.js', 'rescue-story3d.js'):
            self.assertIn(asset, server)
            self.assertIn(asset, hosted)


if __name__ == '__main__':
    unittest.main()
