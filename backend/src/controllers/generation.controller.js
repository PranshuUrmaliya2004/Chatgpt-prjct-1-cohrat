const PDFDocument = require("pdfkit");
const { generateContent, generateImage } = require("../service/ai.service");

const MAX_PROMPT_LENGTH = 4000;

function getPrompt(req, res) {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    res.status(400).json({
      message: `Enter a prompt between 1 and ${MAX_PROMPT_LENGTH} characters.`,
    });
    return null;
  }
  return prompt;
}

async function generatePdfController(req, res) {
  const prompt = getPrompt(req, res);
  if (!prompt) return;

  const requestedTitle =
    typeof req.body.title === "string" ? req.body.title.trim() : "";
  const title = requestedTitle.slice(0, 100) || "Trisha AI document";
  try {
    const content = await generateContent(
      `Create polished, well-structured content for a PDF document. Use plain text headings and paragraphs, and do not include markdown code fences unless the document is specifically about code. User request: ${prompt}`,
    );
    const fileName =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "trisha-ai-document";
    const document = new PDFDocument({ size: "A4", margin: 56 });
    document.on("error", (error) => {
      console.error("PDF generation error:", error.message);
      if (res.headersSent) res.destroy(error);
      else res.status(500).json({ message: "Could not create the PDF." });
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.pdf"`,
    );
    document.pipe(res);
    document.font("Helvetica-Bold").fontSize(20).text(title);
    document.moveDown();
    document.font("Helvetica").fontSize(11).text(content);
    document.end();
  } catch (error) {
    console.error("PDF content generation error:", error.message);
    res.status(503).json({
      message: error.message || "PDF generation is temporarily unavailable.",
    });
  }
}

async function generateImageController(req, res) {
  const prompt = getPrompt(req, res);
  if (!prompt) return;

  try {
    const image = await generateImage(prompt);
    const extension = image.mimeType === "image/png" ? "png" : "jpg";
    res.json({
      fileName: `trisha-image-${Date.now()}.${extension}`,
      mimeType: image.mimeType,
      data: `data:${image.mimeType};base64,${image.imageBytes}`,
    });
  } catch (error) {
    res.status(503).json({
      message: error.message || "Image generation is temporarily unavailable.",
    });
  }
}

module.exports = {
  generatePdfController,
  generateImageController,
};