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


if __name__ == '__main__':
    unittest.main()
