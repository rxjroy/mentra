const pdf = require('pdf-parse');

console.log("PDFParse:", typeof pdf.PDFParse);
if (typeof pdf.PDFParse === 'function') {
  console.log("PDFParse is class/function");
  try {
    const parser = new pdf.PDFParse();
    console.log("parser methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
  } catch (e) {
    console.log("new PDFParse error:", e.message);
  }
}
