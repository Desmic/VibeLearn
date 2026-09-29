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
                textures:{paint:{type:'brush',seed:7,colors:['#f4d46c','#dc944e','#fff1a3','#aa6846']}},
                materials:{fruit:{diffuse:'#ffcc44',metalness:.25,gloss:.6,texture:'paint'},
                  sky:{diffuse:'#ffffff',unlit:true,texture:'paint'}},
                geometries:{bloom:{type:'sphere',options:{radius:.5,latitudeBands:7,longitudeBands:10}}},
                batchGroups:{orchard:{maxAabbSize:8}},
                entities:[{id:'backdrop',primitive:'box',material:'sky',position:[0,0,-2],scale:[8,6,.1]},
                          {id:'grove'},
                          {id:'fruit-left',parent:'grove',geometry:'bloom',material:'fruit',batchGroup:'orchard',position:[-.7,0,0]},
                          {id:'fruit-right',parent:'grove',geometry:'bloom',material:'fruit',batchGroup:'orchard',position:[.7,0,0]}],
                cameras:{overview:{position:[0,1,5],lookAt:[0,0,0],fov:45}},
                states:{ready:{camera:'overview'}}
              },{pixelRatioCap:1,interactive:false});
              if(!world.available)throw Error(world.error);
              const shared=world.geometryMeshes.get('bloom');
              const material=world.materials.get('fruit');
              const reuse={mesh:world.entities.get('fruit-left').render.meshInstances[0].mesh===shared
                &&world.entities.get('fruit-right').render.meshInstances[0].mesh===shared,
                texture:material.diffuseMap===world.surfaceTextures.get('paint'),
                metalness:material.useMetalness&&Math.abs(material.metalness-.25)<.001,
                unlit:world.materials.get('sky').emissiveMap===world.surfaceTextures.get('paint')
                  &&world.materials.get('sky').diffuse.r===0};
              const batching=()=>world.app.batcher._batchList.map(batch=>({
                groupId:batch.batchGroupId,members:batch.origMeshInstances?.length||0}));
              const samples=[];
              const sample=async phase=>{
                await new Promise(resolve=>setTimeout(resolve,250));
                const s=world.stats();
                samples.push({phase,width:s.bufferWidth,height:s.bufferHeight,
                  cssWidth:s.canvasCssWidth,cssHeight:s.canvasCssHeight,
                  sharedGeometryCount:s.sharedGeometryCount,drawCalls:s.drawCalls,frameMs:s.frameMs,
                  batchCount:s.batchCount,batching:batching(),lastRenderedDrawCalls:s.lastRenderedDrawCalls,
                  renderedFrameCount:s.renderedFrameCount,autoRender:s.autoRender,
                  glError:world.app.graphicsDevice.gl.getError()});
              };
              await sample('visible');
              world.applyPatch({hide:['grove']});await sample('grove-hidden');
              world.applyPatch({show:['grove']});await sample('grove-shown');
              world.setPaused(true);await sample('paused');
              world.setPaused(false);await sample('resumed');
              host.style.display='none';await sample('hidden');
              host.style.display='';await sample('shown');
              host.remove();await sample('detached');
              Object.assign(host.style,{width:'900px',height:'360px'});
              document.body.append(host);await sample('reattached-landscape');
              world.dispose();host.remove();return {samples,reuse,disposed:{
                meshes:world.geometryMeshes.size,textures:world.surfaceTextures.size,
                entities:world.entities.size,canvas:host.querySelectorAll('canvas').length}};
            }""")
            (ROOT/'artifacts/renderer-lifecycle.json').write_text(
                json.dumps({**results, 'graphics_warnings': warnings}, indent=2),
                encoding='utf-8')
            assert all(results['reuse'].values()), results['reuse']
            assert any(batch['members'] == 2 for batch in results['samples'][0]['batching']), results['samples']
            assert all(not sample['autoRender'] for sample in results['samples']), results['samples']
            assert results['disposed']=={'meshes':0,'textures':0,'entities':0,'canvas':0}, results['disposed']
            samples=results['samples']
            assert all(s['width'] > 0 and s['height'] > 0 for s in samples), samples
            assert all(s['glError'] == 0 for s in samples), samples
            assert not warnings, warnings[:3]
            for sample in (samples[0], samples[2], samples[4], samples[6], samples[8]):
                assert sample['width'] == sample['cssWidth'], sample
                assert sample['height'] == sample['cssHeight'], sample
            print('Shared renderer: mesh/texture reuse and visible, hidden, detached, landscape remount/dispose passed')
        finally:
            browser.close()
            stop_server(proc)


if __name__ == '__main__':
    main()
