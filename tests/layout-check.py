import os

from playwright.sync_api import sync_playwright


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(os.environ.get("DAYFLOW_URL", "http://127.0.0.1:4321/dayflow"), wait_until="networkidle")
    failures = []
    for width in [1440, 1024, 900, 840, 768, 640, 390, 330, 320]:
        page.set_viewport_size({"width": width, "height": 1000})
        issues = page.evaluate("""() => {
          const issues = [];
          if (document.documentElement.scrollWidth > innerWidth) issues.push('page overflow');
          if (document.querySelector('astro-dev-toolbar')) issues.push('dev toolbar visible');
          for (const fields of document.querySelectorAll('.time-fields')) {
            if (fields.scrollWidth > fields.clientWidth + 1) issues.push('time field overflow');
            const main = fields.closest('.lesson').querySelector('.lesson-main').getBoundingClientRect();
            for (const input of fields.querySelectorAll('input')) {
              const box = input.getBoundingClientRect();
              if (box.right > main.left + 1 && box.left < main.right - 1 &&
                  box.bottom > main.top + 1 && box.top < main.bottom - 1) issues.push('time overlaps title');
            }
          }
          const link = document.querySelector('.topbar nav a');
          if (getComputedStyle(link).color !== getComputedStyle(link.parentElement).color) issues.push('browser link color');
          return issues;
        }""")
        if issues:
            failures.append(f"{width}px: {', '.join(sorted(set(issues)))}")
    browser.close()
    assert not failures, "\n".join(failures)
    print("Layout checked at 9 viewport widths: no overlaps or horizontal overflow.")
