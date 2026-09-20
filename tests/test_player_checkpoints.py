"""Shared chapter handoffs on unrelated synthetic geometry with real DOM input."""
import base64
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class PlayerCheckpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()
        source = (ROOT/'web/player-controls.js').read_bytes()
        cls.module_url = 'data:text/javascript;base64,' + base64.b64encode(source).decode()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.set_content('<div id="world" tabindex="0" style="width:800px;height:600px"></div>')
        self.page.evaluate('''async url=>{
          const {createPlayerControls}=await import(url);
          window.bridgeVisible=false;window.avatarCalls=[];
          const profile={spawn:[12,2,24],speed:4,body:{radius:.3,height:1.5},
            surfaces:[{bounds:[10,20,20,30],height:2},
              {bounds:[22,28,20,30],height:3,whenVisible:'bridge'}],
            obstacles:[[15,2,25,16,5,26]],
            camera:{yaw:0,pitch:30,distance:8,minDistance:3,maxDistance:15,targetHeight:1}};
          const adapter={isEntityEnabled:()=>window.bridgeVisible,
            isPlayerBlocked:(x,y,z)=>x>18&&z>28,
            setAvatar:(p,f)=>avatarCalls.push({position:[...p],facing:f}),
            setCamera:()=>{},setMoving:()=>{}};
          window.controls=createPlayerControls(document.querySelector('#world'),profile,adapter);
          controls.setMode('third-person','synthetic-mission');
        }''', self.module_url)

    def tearDown(self):
        self.page.close()

    def checkpoint(self, value):
        return self.page.evaluate('value=>controls.setCheckpoint(value)', value)

    def position(self):
        return self.page.evaluate('controls.snapshot().position')

    def test_first_placement_and_repeated_id_preserve_real_keyboard_movement(self):
        first = {'id': 'arrival', 'position': [13, 2, 23], 'facing': 70}
        self.assertTrue(self.checkpoint(first))
        self.assertEqual(self.position(), [13, 2, 23])
        self.assertEqual(self.page.evaluate('avatarCalls.at(-1).facing'), 70)
        self.page.keyboard.down('d')
        self.page.evaluate('()=>{for(let i=0;i<5;i++)controls.update(.05)}')
        self.page.keyboard.up('d')
        moved = self.position()
        self.assertGreater(moved[0], 13.8)
        self.assertTrue(self.checkpoint(first))
        self.assertEqual(self.position(), moved)
        second = {'id': 'next-arrival', 'position': [17, 2, 23]}
        self.assertTrue(self.checkpoint(second))
        self.assertEqual(self.position(), [17, 2, 23])
        self.assertTrue(self.checkpoint({**second, 'position': [12, 2, 24]}))
        self.assertEqual(self.position(), [17, 2, 23])

    def test_invalid_blocked_and_hidden_surface_rejections_do_not_consume_id(self):
        original = self.position()
        invalid = [None, {}, {'id': '', 'position': [13, 2, 23]},
                   {'id': 'bad', 'position': [13, 2]},
                   {'id': 'bad', 'position': ['13', 2, 23]},
                   {'id': 'bad', 'position': [100, 2, 23]},
                   {'id': 'bad', 'position': [15.5, 2, 25.5]},
                   {'id': 'bad', 'position': [19, 2, 29]},
                   {'id': 'bridge', 'position': [24, 3, 24]}]
        for value in invalid:
            with self.subTest(value=value):
                self.assertFalse(self.checkpoint(value))
                self.assertEqual(self.position(), original)
        self.assertFalse(self.page.evaluate("controls.setCheckpoint({id:'bad',position:[NaN,2,23]})"))
        self.assertTrue(self.checkpoint({'id': 'bad', 'position': [13, 2, 23]}))
        self.page.evaluate('window.bridgeVisible=true')
        self.assertTrue(self.checkpoint({'id': 'bridge', 'position': [24, 3, 24]}))
        self.assertEqual(self.position(), [24, 3, 24])

    def test_mode_or_mission_change_rearms_checkpoint_but_same_mode_does_not(self):
        checkpoint = {'id': 'arrival', 'position': [13, 2, 23]}
        self.assertTrue(self.checkpoint(checkpoint))
        self.page.keyboard.down('d')
        self.page.evaluate('controls.update(.05)')
        self.page.keyboard.up('d')
        moved = self.position()
        self.page.evaluate("controls.setMode('third-person','synthetic-mission')")
        self.assertTrue(self.checkpoint(checkpoint))
        self.assertEqual(self.position(), moved)
        self.page.evaluate("()=>{controls.setMode('orbit','replay');controls.setMode('third-person','synthetic-mission')}")
        self.assertEqual(self.position(), [12, 2, 24])
        self.assertTrue(self.checkpoint(checkpoint))
        self.assertEqual(self.position(), [13, 2, 23])
        self.page.evaluate("controls.setMode('third-person','another-mission')")
        self.assertEqual(self.position(), [12, 2, 24])
        self.assertTrue(self.checkpoint(checkpoint))
        self.assertEqual(self.position(), [13, 2, 23])
