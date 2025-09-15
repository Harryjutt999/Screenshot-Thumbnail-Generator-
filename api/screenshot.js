import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url, width = 1280, height = 720, full = "false", type = "png", quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url query param" });
  }

  let browser = null;

  try {
    const executablePath = await chromium.executablePath;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: parseInt(width), height: parseInt(height) },
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(decodeURIComponent(url), {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const options = {
      type: type === "jpeg" ? "jpeg" : "png",
      fullPage: full === "true",
    };
    if (type === "jpeg" && quality) {
      options.quality = Math.max(0, Math.min(100, parseInt(quality)));
    }

    const screenshot = await page.screenshot(options);

    res.setHeader("Content-Type", type === "jpeg" ? "image/jpeg" : "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error("❌ Screenshot error:", err);
    res.status(500).json({ error: "Screenshot failed", details: String(err) });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
