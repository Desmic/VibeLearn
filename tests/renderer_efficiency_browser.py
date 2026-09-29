"""Bounded same-spec native-batch and render-on-demand measurement."""
import json
import os
import tempfile
import time
from pathlib import Path

try:
    import psutil
except ImportError:
    psutil = None
from playwright.sync_api import sync_playwright

from tests.browser_check import start_server, stop_server, launch_browser

ROOT = Path(__file__).resolve().parents[1]


def browser_process_ids():
    if psutil is None:
        return set()
    return {proc.pid for proc in psutil.process_iter(['name'])
            if any(word in (proc.info['name'] or '').lower() for word in ('chrome', 'chromium', 'headless'))}


def browser_cpu(existing_ids):
    if psutil is None:
        return None, None, 0
    total = gpu_process = 0.0
    measured = 0
    for pid in browser_process_ids() - existing_ids:
        try:
            proc = psutil.Process(pid)
            times = proc.cpu_times()
            seconds = times.user + times.system
            total += seconds
            measured += 1
            if '--type=gpu-process' in ' '.join(proc.cmdline()):
                gpu_process += seconds
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return total, gpu_process, measured


def sample(page, phase, seconds, existing_ids):
    before = browser_cpu(existing_ids)
    start = time.monotonic()
    page.wait_for_timeout(round(seconds * 1000))
    duration = time.monotonic() - start
    after = browser_cpu(existing_ids)
    value = page.evaluate("""() => {
      const s=window.proofWorld.stats();
      return {drawCalls:s.lastRenderedDrawCalls,renderedFrames:s.renderedFrameCount,
        batches:s.batchCount,assetsPending:s.assetsPending,assetsFailed:s.assetsFailed,
        entityCount:s.entityCount,deviceType:s.deviceType,
        webglRenderer:window.proofWorld.app.graphicsDevice.gl.getParameter(
          window.proofWorld.app.graphicsDevice.gl.RENDERER)};
    }""")
    return {'phase': phase, 'seconds': round(duration, 3),
            'browser_cpu_seconds': round(after[0] - before[0], 3) if after[2] and before[2] else None,
            'gpu_process_cpu_seconds': round(after[1] - before[1], 3) if after[2] and before[2] else None,
            'cpu_processes_measured': after[2], **value}


def main():
    output = {'note': 'Process CPU time is not GPU utilization. Samples are sequential and include browser overhead.',
              'worlds': []}
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as playwright:
        server, url = start_server(Path(temp) / 'renderer-efficiency.db')
        existing_browser_ids = browser_process_ids()
        browser = launch_browser(playwright)
        try:
            output['initial_new_browser_process_count'] = len(browser_process_ids() - existing_browser_ids)
            page = browser.new_page(viewport={'width': 1280, 'height': 720})
            page.route('**/renderer-proof', lambda route: route.fulfill(
                content_type='text/html', body='<html><body style="margin:0"></body></html>'))
            page.goto(url + '/renderer-proof')
            for batching in (False, True):
                page.evaluate("""async batching => {
                  const {worldSpec}=await import('/first-words-world.js');
                  const {createPlayCanvasWorld}=await import('/playcanvas-backend.js');
                  const spec=structuredClone(worldSpec);
                  if(!batching){delete spec.batchGroups;for(const entity of spec.entities)delete entity.batchGroup;}
                  const host=document.createElement('div');
                  Object.assign(host.style,{width:'1280px',height:'720px'});
                  document.body.append(host);
                  window.proofHost=host;
                  window.proofWorld=createPlayCanvasWorld(host,spec,{interactive:false,pixelRatioCap:1});
                  if(!window.proofWorld.available)throw Error(window.proofWorld.error);
                }""", batching)
                page.wait_for_function('window.proofWorld.stats().assetsPending===0', timeout=20000)
                page.wait_for_timeout(700)
                label = 'native_static_batch' if batching else 'same_spec_unbatched'
                phases = [sample(page, 'active', 2, existing_browser_ids)]
                page.evaluate('window.proofWorld.setPaused(true)')
                page.wait_for_timeout(250)  # allow one already-submitted frame to finish
                phases.append(sample(page, 'paused', 2, existing_browser_ids))
                page.evaluate("window.proofHost.style.display='none'")
                phases.append(sample(page, 'css_hidden', 2, existing_browser_ids))
                page.evaluate("window.proofHost.style.display='' ; window.proofWorld.setPaused(false)")
                phases.append(sample(page, 'restored', 1, existing_browser_ids))
                page.evaluate('window.proofWorld.dispose();window.proofHost.remove();delete window.proofWorld;delete window.proofHost')
                output['worlds'].append({'label': label, 'phases': phases})
            path = ROOT / 'artifacts' / 'renderer-efficiency.json'
            path.write_text(json.dumps(output, indent=2), encoding='utf-8')
            for world in output['worlds']:
                phases = world['phases']
                assert phases[0]['assetsFailed'] == 0, phases[0]
                assert 0 <= phases[1]['renderedFrames'] - phases[0]['renderedFrames'] <= 1, phases
                assert phases[2]['renderedFrames'] == phases[1]['renderedFrames'], phases
                assert phases[3]['renderedFrames'] > phases[2]['renderedFrames'], phases
            print('Same-spec renderer active/paused/hidden/restored comparison passed:', path)
        finally:
            browser.close()
            stop_server(server)


if __name__ == '__main__':
    main()
