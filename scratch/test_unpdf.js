async function test() {
  const { extractText } = await import('unpdf');
  console.log("unpdf extractText available:", typeof extractText);

  const mammoth = await import('mammoth');
  console.log("mammoth available:", typeof mammoth.extractRawText);
}

test();
