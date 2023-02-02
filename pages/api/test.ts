import playwright from "playwright";
import { writeFileSync } from "fs";
import { performance, PerformanceObserver } from "perf_hooks";
import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument } from "pdf-lib";

type Data = Buffer;

const getPagesAsPDFDocuments = async (urls: string[]) => {
  const pdfs: Promise<PDFDocument>[] = [];
  const generatePDF = async (url: string) => {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    const file = await page.pdf({ path: `document.pdf` });
    await browser.close();
    return await PDFDocument.load(file);
  };

  for (const url of urls) {
    pdfs.push(generatePDF(url))
  }

  return Promise.all(pdfs);
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
  const observer = new PerformanceObserver((list) =>
    list.getEntries().forEach((entry) => console.info(entry))
  );
  observer.observe({ buffered: true, entryTypes: ["measure"] });
  performance.mark("start");

  const resultFile = await mergePDFs(
    await getPagesAsPDFDocuments([
      "https://www.google.com/search?q=Google",
      "https://www.google.com/search?q=pdf-lib",
      "https://www.google.com/search?q=dogs",
    ])
  );

  performance.mark("stop");
  performance.measure("Business Logic", "start", "stop");
  writeFileSync("test.pdf", resultFile);
  const toServe = Buffer.from(resultFile);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="test.pdf"');
  res.send(toServe);
};

export default handler;