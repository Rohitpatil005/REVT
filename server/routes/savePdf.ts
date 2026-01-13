import { RequestHandler } from "express";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import os from "os";

function getOrgFolder(org: string): string {
  const base = path.join(os.homedir(), "Documents");
  if (org === "rohit") return path.join(base, "Invoice RE");
  if (org === "vighneshwar") return path.join(base, "Invoice VT");
  return path.join(base, "Invoices");
}

async function ensureDir(dir: string): Promise<void> {
  try {
    if (!fsSync.existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`[savePdf] Created directory: ${dir}`);
    }
  } catch (error) {
    console.error(`[savePdf] Failed to create directory ${dir}:`, error);
    throw error;
  }
}

export const handleSavePdf: RequestHandler = async (req, res) => {
  console.log(`[savePdf] ========== API CALLED ==========`);
  console.log(`[savePdf] Request body keys:`, Object.keys(req.body));

  try {
    const { org, fileName, pdfData } = req.body;

    // Validate inputs
    if (!org || !fileName || !pdfData) {
      console.error("[savePdf] ❌ Missing required fields:", {
        org: !!org,
        fileName: !!fileName,
        pdfData: pdfData ? `${pdfData.length} chars` : null
      });
      return res.status(400).json({
        error: "Missing required fields: org, fileName, or pdfData",
        received: { org: !!org, fileName: !!fileName, pdfData: !!pdfData },
      });
    }

    console.log(`[savePdf] 🔄 Saving PDF for org: ${org}, fileName: ${fileName}`);
    console.log(`[savePdf] Data size: ${pdfData.length} bytes`);

    // Get the target folder
    const folder = getOrgFolder(org);
    console.log(`[savePdf] Target folder: ${folder}`);

    // Ensure directory exists
    try {
      await ensureDir(folder);
      console.log(`[savePdf] ✅ Directory ready`);
    } catch (dirError) {
      console.error(`[savePdf] ❌ Failed to create directory:`, dirError);
      return res.status(500).json({
        error: "Cannot create directory",
        details: dirError instanceof Error ? dirError.message : String(dirError),
      });
    }

    // Construct full path
    const fullPath = path.join(folder, fileName);
    console.log(`[savePdf] Full path: ${fullPath}`);

    // Convert base64 to buffer
    let buffer: Buffer;
    try {
      if (typeof pdfData === "string") {
        console.log(`[savePdf] Decoding base64...`);
        buffer = Buffer.from(pdfData, "base64");
        console.log(`[savePdf] ✅ Decoded: ${buffer.length} bytes`);
      } else {
        throw new Error(`Invalid type: ${typeof pdfData}`);
      }
    } catch (bufError) {
      console.error(`[savePdf] ❌ Failed to decode base64:`, bufError);
      return res.status(400).json({
        error: "Invalid base64 data",
        details: bufError instanceof Error ? bufError.message : String(bufError),
      });
    }

    // Write file to disk
    try {
      console.log(`[savePdf] 💾 Writing ${buffer.length} bytes to disk...`);
      await fs.writeFile(fullPath, buffer);
      console.log(`[savePdf] ✅ File written successfully`);
    } catch (writeError) {
      console.error(`[savePdf] ❌ Failed to write file:`, writeError);
      return res.status(500).json({
        error: "Failed to write PDF file",
        details: writeError instanceof Error ? writeError.message : String(writeError),
      });
    }

    console.log(`[savePdf] ✅✅✅ SUCCESS: PDF saved at ${fullPath}`);

    return res.json({
      success: true,
      message: "PDF saved successfully",
      path: fullPath,
      fileName,
      org,
    });
  } catch (error) {
    console.error("[savePdf] ❌ Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Unexpected error",
      details: errorMessage,
    });
  }
};
