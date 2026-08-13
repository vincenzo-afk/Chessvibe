"""Automated browser tests for the ChessVibe app (headless Chromium)."""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8899/"


def sq(page, name):
    """Helper: click a square by data-square attribute (true click event)."""
    page.evaluate(f"""() => {{
        const el = document.querySelector('.square[data-square="{name}"]');
        if (!el) return;
        el.dispatchEvent(new MouseEvent('mousedown', {{bubbles: true}}));
        el.dispatchEvent(new MouseEvent('mouseup', {{bubbles: true}}));
        el.dispatchEvent(new MouseEvent('click', {{bubbles: true}}));
    }}""")


def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1. Page loads without JS errors
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2500)
        results.append(("page_load_no_js_errors", len(errors) == 0, errors[:3]))
        print("errors on load:", errors)

        # 2. Navbar GitHub button
        btn = page.locator("#btn-github-repo")
        href = btn.get_attribute("href")
        results.append(("github_button_repo_link", href == "https://github.com/vincenzo-afk/Chessvibe", href))

        # 3. Mode screen GitHub link
        link = page.locator(".mode-github-link")
        results.append(("mode_github_link", link.count() == 1, link.count()))

        # 4. SEO meta tags
        html = page.content()
        seo = {
            "meta_title": "Free Online Multiplayer Chess" in page.title(),
            "og_image": 'property="og:image"' in html,
            "twitter_card": 'name="twitter:card"' in html,
            "json_ld": '"WebApplication"' in html,
            "favicon": 'rel="icon"' in html,
        }
        for k, v in seo.items():
            results.append((k, v, v))

        # 5. Start a local game
        page.locator(".mode-card[data-mode='local']").click()
        page.locator("#btn-start-local").wait_for(state="visible", timeout=10000)
        page.locator("#btn-start-local").click()
        page.wait_for_timeout(1500)
        board_visible = page.locator("#board .square").count() == 64
        results.append(("local_game_starts", board_visible, board_visible))

        # NOTE: local mode auto-flips the board after each move, so display square
        # positions change. We read logical state from G.game and the DOM consistently.
        # NOTE: G is declared with `const` at top level, so it is NOT a window
        # property. We reach it via Function constructor evaluation instead.
        def evalG(expr):
            return page.evaluate(f"Function('return {expr};')()")

        def board_state():
            return page.evaluate("""() => {
                const at = (s) => {
                    const el = document.querySelector(`.square[data-square="${s}"] .piece`);
                    return el ? el.textContent.trim() : '';
                };
                const G = Function('return G')();
                if (!G || !G.game) return {ok: false};
                return {ok: true, flipped: G.flipped, turn: G.game.turn(),
                        fen: G.game.fen(), history: G.game.history().length,
                        e4: at('e4'), e2: at('e2'), e5: at('e5'), b1: at('b1'), b4: at('b4'),
                        a5: at('a5'), a7: at('a7'), b8: at('b8'), g1: at('g1')};
            }""")

        # 6. Click-to-move: e2 -> e4 (white pawn); board flips after the move in local mode
        sq(page, "e2")
        sq(page, "e4")
        page.wait_for_timeout(500)
        dbg = page.evaluate("() => ({typeofG: typeof G, hasGame: !!(G && G.game), mode: G && G.mode})")
        s = board_state()
        print("after e2-e4 dbg:", dbg)
        print("after e2-e4:", json.dumps(s, indent=2))
        e4_just_after = s and s["ok"] and s["history"] == 1 and s["e4"] == "♙" and s["e2"] == ""
        results.append(("click_move_e2e4", e4_just_after, s))

        # Black pawn move test (after flip, black moves): click a7 -> a5 (legal black pawn push)
        sq(page, "a7")
        sq(page, "a5")
        page.wait_for_timeout(500)
        s = board_state()
        print("after a7-a5:", json.dumps(s, indent=2))
        results.append(("black_move_a7a5", s and s["ok"] and s["history"] == 2 and s["a5"] == "♟" and s["a7"] == "" and s["turn"] == "w", s))

        # 7. Illegal move rejected: knight g1 -> b4 illegal; g1 should still hold the knight
        sq(page, "g1")
        sq(page, "b4")
        page.wait_for_timeout(500)
        s = board_state()
        print("after illegal g1-b4:", json.dumps(s, indent=2))
        results.append(("illegal_move_rejected", s and s["ok"] and s["history"] == 2 and s["g1"] == "♘" and s["b4"] == "", s))

        # 8. Drag e4 pawn -> e5 (legal); board flips after, so check g5 display? Verify via G.game + history
        ok = page.evaluate("""() => {
            const fromPiece = document.querySelector('.square[data-square="e4"] .piece');
            const to        = document.querySelector('.square[data-square="e5"]');
            if (!fromPiece || !to) return 'no-squares';
            const fr = fromPiece.getBoundingClientRect(), tr = to.getBoundingClientRect();
            const o1 = {bubbles:true,cancelable:true,pointerId:1,clientX:fr.x+fr.width/2,clientY:fr.y+fr.height/2};
            const o2 = {bubbles:true,cancelable:true,pointerId:1,clientX:tr.x+tr.width/2,clientY:tr.y+tr.height/2};
            fromPiece.dispatchEvent(new MouseEvent('mousedown', {bubbles:true,cancelable:true,clientX:o1.clientX,clientY:o1.clientY}));
            document.dispatchEvent(new MouseEvent('mousemove', {bubbles:true,cancelable:true,clientX:o2.clientX,clientY:o2.clientY}));
            document.dispatchEvent(new MouseEvent('mouseup', {bubbles:true,cancelable:true,clientX:o2.clientX,clientY:o2.clientY}));
            return 'dragged';
        }""")
        page.wait_for_timeout(500)
        s = board_state()
        print("drag e4->e5:", ok, json.dumps(s, indent=2))
        drag_ok = ok == "dragged" and s and s["ok"] and s["history"] == 3 and s["e5"] == "♙" and s["e4"] == ""
        results.append(("drag_move_e4e5", drag_ok, str({"drag": ok, **s} if s else None)))

        # 9. Bot mode smoke test
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2500)
        page.locator(".mode-card[data-mode='bot']").click()
        try:
            page.locator("#btn-start-bot").wait_for(state="visible", timeout=10000)
            page.locator("#btn-start-bot").click()
            page.wait_for_timeout(4500)
            board_visible = page.locator("#board .square").count() == 64
            g_ready = page.evaluate("() => typeof G !== 'undefined' && !!G.game")
            print("G ready:", g_ready, "squares:", page.locator("#board .square").count())
            results.append(("bot_mode_starts", board_visible, board_visible))
        except Exception as e:
            results.append(("bot_mode_starts", False, str(e)[:200]))

        # 10. Online modal
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2500)
        page.locator(".mode-card[data-mode='online']").click()
        try:
            page.locator("#modal-online").wait_for(state="visible", timeout=10000)
            results.append(("online_modal_opens", True, True))
            has = page.locator("#room-code-box").count() > 0 and page.locator("#btn-copy-invite").count() > 0
            results.append(("online_room_code_ui", has, has))
        except Exception as e:
            results.append(("online_modal_opens", False, str(e)[:200]))
            results.append(("online_room_code_ui", False, "modal not visible"))

        print(json.dumps(results, indent=2))
        with open("/home/ubuntu/test_results.json", "w") as f:
            json.dump(results, f, indent=2)
        browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{'ALL PASSED' if not failed else 'FAILURES: ' + str(failed)}")
    return len(failed) == 0


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
