"""Visual verification of the full-screen board on desktop and mobile viewports."""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:8899/"

def sq_helper():
    return """() => {
      const out = {};
      document.querySelectorAll('.square[data-square]').forEach(sq => {
        const r = sq.getBoundingClientRect();
        const p = sq.querySelector('.piece');
        out[sq.dataset.square] = {
          w: Math.round(r.width), h: Math.round(r.height),
          x: Math.round(r.x), y: Math.round(r.y),
          piece: p ? p.textContent.trim() : ''
        };
      });
      const board = document.getElementById('board');
      const br = board ? board.getBoundingClientRect() : null;
      return JSON.stringify({
        boardW: br ? Math.round(br.width) : -1,
        boardH: br ? Math.round(br.height) : -1,
        innerH: window.innerHeight, innerW: window.innerWidth,
        squares: out
      });
    }"""

async def capture(vw, vh, path):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": vw, "height": vh},
                                        device_scale_factor=2, user_agent="Mozilla/5.0 (test)")
        page = await ctx.new_page()
        page.on("pageerror", lambda e: print("PAGEERROR:", e))
        await page.goto(BASE, wait_until="networkidle")
        await page.click(".mode-card[data-mode='local']");
        await page.wait_for_timeout(400)
        await page.click("#btn-start-local") if await page.is_visible("#btn-start-local", timeout=1000) else None
        await page.wait_for_timeout(300)
        # click e2-e4 to get pieces mid-game
        await page.evaluate("""() => {
          const s = d => document.querySelector(`.square[data-square="${d}"]`);
          const click = d => s(d)?.dispatchEvent(new MouseEvent('click', {bubbles:true}));
          click('e2'); click('e4');
        }""")
        await page.wait_for_timeout(700)
        await page.screenshot(path=path)
        info = await page.evaluate(sq_helper())
        print(f"--- {path} ({vw}x{vh}) ---")
        print(info[:800])
        # check board fill ratio
        import json
        d = json.loads(info)
        fill = d['boardH'] / (d['innerH'] - 200)
        print(f"board height fill ratio: {fill:.2f}")
        await browser.close()

async def main():
    await capture(1440, 900, "/home/ubuntu/board_desktop.png")
    await capture(390, 844, "/home/ubuntu/board_mobile.png")

asyncio.run(main())
