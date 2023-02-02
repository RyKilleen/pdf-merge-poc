import playwright from "playwright";
import { writeFileSync } from "fs";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument } from "pdf-lib";

type Data = Buffer;

const getPageAsPDFDocument = async (url: string) => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  const file = await page.pdf({ path: `document.pdf` });
  await browser.close();
  return await PDFDocument.load(file);
};

const mergePDFs = async (pdfs: PDFDocument[]) => {
  const mergedPdf = await PDFDocument.create();

  for (const pdf of pdfs) {
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
};

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const pdfA = await getPageAsPDFDocument(
    "https://www.google.com/search?q=Google"
  );
  const pdfB = await getPageAsPDFDocument(
    "https://www.google.com/search?q=pdf-lib"
  );
  const resultFile = await mergePDFs([pdfA, pdfB]);

  writeFileSync("test.pdf", resultFile);
  const toServe = Buffer.from(resultFile);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="test.pdf"');
  res.send(toServe);
};
export default handler;
