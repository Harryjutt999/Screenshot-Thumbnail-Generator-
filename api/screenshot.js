import chromium from "chrome-aws-lambda";

export default async function handler(req, res) {
  const { url, width = 1280, height = 720, full = "false", type = "png", quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url query param" });
  }

  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: { width: parseInt(width), height: parseInt(height) },
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

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
    console.error("Error:", err);
    res.status(500).json({ error: "Screenshot failed", details: String(err) });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
                        }
