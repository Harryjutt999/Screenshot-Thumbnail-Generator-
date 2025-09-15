import chromium from "chrome-aws-lambda";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL is required");

  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const screenshot = await page.screenshot({ type: "png" });

    res.setHeader("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error("Screenshot error:", err);
    res.status(500).send("Capture failed: " + err.message);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
