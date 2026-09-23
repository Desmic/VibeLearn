"""A bounded surface must keep its decision visible at any text size (guide I10)."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SCRIPT = r'''
import {fitBoundedSurface} from MODULE;
// Minimal DOM: sections with a rank and a height, a surface whose content height is the
// sum of what is not shed, and a classList that behaves like the real one.
function section(rank,height,critical){
  const classes=new Set();
  return {dataset:{shedItem:String(rank),...(critical?{critical:'true'}:{})},height,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}};
}
function surface(sections,{base=60,client=280}={}){
  return {sections,clientHeight:client,
    get scrollHeight(){return base+sections.filter(s=>!s.classList.contains('shed')).reduce((n,s)=>n+s.height,0);},
    querySelectorAll:()=>sections};
}
const build=()=>surface([section(10,60),section(30,215),section(40,50),section(50,50)]);
// The same beat with a learning hint inside it: rank 25, but instruction, so the ladder
// runs out of things it is allowed to hide before it runs out of room.
const taught=()=>surface([section(10,60),section(25,120,true),section(40,50)]);
const ranks=s=>s.sections.filter(x=>x.classList.contains('shed')).map(x=>Number(x.dataset.shedItem));
const normal=build();                                   // 435 content, 280 box: sheds
const first=fitBoundedSurface(normal);
const r_first=ranks(normal);
// The same beat at a smaller text size: room returns, and the surface takes back every
// rung it can afford in this one call, keeping only the shed it still needs.
normal.clientHeight=380;
const partial=fitBoundedSurface(normal);
const r_partial=ranks(normal);
normal.clientHeight=600;
const room=fitBoundedSurface(normal);
const r_room=ranks(normal);
const hopeless=build();hopeless.clientHeight=40;
const tight=taught();tight.clientHeight=170;
const none=surface([]);
const stuck=fitBoundedSurface(hopeless);
const shed_tight=fitBoundedSurface(tight);
const idle=fitBoundedSurface(surface([section(10,20)],{client:280}));
const empty=fitBoundedSurface(none);
console.log(JSON.stringify({first,r:r_first,partial,r_partial:r_partial,room,r_room:r_room,
  stuck,r_stuck:ranks(hopeless),empty,idle,
  tight:ranks(tight),tight_fits:shed_tight.fits}));
'''.replace('MODULE', json.dumps((ROOT / 'web/surface-fit.js').as_uri()))


class SurfaceFitTests(unittest.TestCase):
    def setUp(self):
        self.result = subprocess.run(['node', '--input-type=module', '-e', SCRIPT], cwd=ROOT,
                                     capture_output=True, text=True)
        self.assertEqual(self.result.returncode, 0, self.result.stderr)
        self.data = json.loads(self.result.stdout)

    def test_a_breaching_surface_sheds_the_lowest_rung_first(self):
        # 60+215+50+50+base 60 = 435 in a 280 box: only the eyebrow (60) plus the option
        # quotes (215) have to go before the decision fits; the input line stays.
        self.assertEqual(self.data['r'], [10, 30])
        self.assertTrue(self.data['first']['fits'])

    def test_room_comes_back_in_one_pass_not_one_rung_per_tick(self):
        # 375 of content in a 380 box: the quotes come back, the eyebrow still cannot.
        self.assertEqual(self.data['r_partial'], [10])
        self.assertTrue(self.data['partial']['fits'])
        # A box that holds all of it gives the whole surface back immediately.
        self.assertEqual(self.data['r_room'], [])
        self.assertTrue(self.data['room']['fits'])

    def test_a_surface_that_cannot_fit_reports_it_instead_of_lying(self):
        self.assertEqual(self.data['r_stuck'], [10, 30, 40, 50])
        self.assertFalse(self.data['stuck']['fits'])

    def test_a_surface_with_nothing_to_shed_is_left_alone(self):
        self.assertIsNone(self.data['empty'])
        self.assertEqual(self.data['idle']['shed'], 0)

    def test_an_instruction_in_the_surface_is_never_the_thing_that_goes(self):
        # 290 of content in a 170 box: the ladder takes the eyebrow and the quoted option
        # text, and reports that it still does not fit rather than hiding the hint. The
        # fix for that report is shorter authored text, not a shed teaching line.
        self.assertEqual(self.data['tight'], [10, 40])
        self.assertFalse(self.data['tight_fits'])


if __name__ == '__main__':
    unittest.main()
