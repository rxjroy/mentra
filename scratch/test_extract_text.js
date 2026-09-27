const { extractText } = require('unpdf');
const mammoth = require('mammoth');

async function extractTextFromBuffer(buffer, fileName) {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.endsWith('.pdf')) {
    try {
      const result = await extractText(new Uint8Array(buffer));
      const text = Array.isArray(result.text) ? result.text.join('\n') : (result.text || '');
      if (text.trim().length > 10) {
        return text.trim();
      }
    } catch (e) {
      console.warn("unpdf extraction failed:", e);
    }
  }

  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 10) {
        return result.value.trim();
      }
    } catch (e) {
      console.warn("mammoth extraction failed:", e);
    }
  }

  // Fallback for TXT, MD, JSON, or plain text
  try {
    const raw = buffer.toString('utf-8');
    return raw.replace(/[\r\n]+/g, '\n').trim();
  } catch (e) {
    return buffer.toString('ascii');
  }
}

async function run() {
  console.log("extractTextFromBuffer function built successfully");
}

run();
