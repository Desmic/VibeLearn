"""Real shared-renderer lifecycle checks, independent of the authored game."""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    warnings, results = [], []
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as p:
        proc, url = start_server(Path(temp) / 'renderer.db')
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': 1280, 'height': 900})
            page.on('console', lambda m: warnings.append(m.text) if
                    'GL_INVALID' in m.text or 'Framebuffer is incomplete' in m.text else None)
            page.route('**/renderer-proof', lambda r: r.fulfill(
                content_type='text/html', body='<html><body></body></html>'))
            page.goto(url + '/renderer-proof')
            results = page.evaluate("""async () => {
              const {createPlayCanvasWorld}=await import('/playcanvas-backend.js');
              const host=document.createElement('div');
              Object.assign(host.style,{width:'390px',height:'420px'});
              document.body.append(host);
              const world=createPlayCanvasWorld(host,{
                schemaVersion:'1',id:'lifecycle.orchard',version:'1',
                environment:{clearColor:'#102838',ambient:'#cccccc'},
                materials:{fruit:{diffuse:'#ffcc44'}},
                entities:[{id:'fruit',primitive:'sphere',material:'fruit'}],
                cameras:{overview:{position:[0,1,5],lookAt:[0,0,0],fov:45}},
                states:{ready:{camera:'overview'}}
              },{pixelRatioCap:1,interactive:false});
              if(!world.available)throw Error(world.error);
              const samples=[];
              const sample=async phase=>{
                await new Promise(resolve=>setTimeout(resolve,250));
                const s=world.stats();
                samples.push({phase,width:s.bufferWidth,height:s.bufferHeight,
                  cssWidth:s.canvasCssWidth,cssHeight:s.canvasCssHeight,
                  glError:world.app.graphicsDevice.gl.getError()});
              };
              await sample('visible');
              host.style.display='none';await sample('hidden');
              host.style.display='';await sample('shown');
              host.remove();await sample('detached');
              Object.assign(host.style,{width:'900px',height:'360px'});
              document.body.append(host);await sample('reattached-landscape');
              world.dispose();host.remove();return samples;
            }""")
            (ROOT/'artifacts/renderer-lifecycle.json').write_text(
                json.dumps({'samples': results, 'graphics_warnings': warnings}, indent=2),
                encoding='utf-8')
            assert all(s['width'] > 0 and s['height'] > 0 for s in results), results
            assert all(s['glError'] == 0 for s in results), results
            assert not warnings, warnings[:3]
            for sample in (results[0], results[2], results[4]):
                assert sample['width'] == sample['cssWidth'], sample
                assert sample['height'] == sample['cssHeight'], sample
            print('Shared renderer: visible, hidden, detached and landscape remount passed')
        finally:
            browser.close()
            stop_server(proc)


if __name__ == '__main__':
    main()
