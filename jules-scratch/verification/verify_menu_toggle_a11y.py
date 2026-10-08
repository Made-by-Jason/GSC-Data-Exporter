import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        file_path = os.path.abspath("index.html")
        await page.goto(f"file://{file_path}")

        btn = await page.query_selector("#menu-toggle")
        assert btn is not None, "Button #menu-toggle not found"

        aria_label = await btn.get_attribute("aria-label")
        print(f"#menu-toggle aria-label: {aria_label}")
        assert aria_label == "Toggle navigation menu", f"Expected 'Toggle navigation menu', got '{aria_label}'"

        await browser.close()
        print("Verification passed: #menu-toggle has valid aria-label.")

if __name__ == "__main__":
    asyncio.run(main())
