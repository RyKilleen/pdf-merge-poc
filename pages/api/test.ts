import playwright from "playwright";

import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument } from "pdf-lib";
import { createObserver } from "@/utils/perf";

type ResponseData = Buffer;

const getPagesAsPDFDocuments = async (
  urls: string[],
  browser: playwright.Browser
) => {
  const generatePDF = async (url: string) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    const file = await page.pdf();

    return await PDFDocument.load(file);
  };

  const pdfs = urls.map((url) => generatePDF(url));

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

const PAGES = [
    "https://ryankilleen.com",
    "https://ryankilleen.com/posts",
    "https://ryankilleen.com/posts/ai-finishes-my-blog-post",
]


const handler = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const observer = createObserver();
  observer.observe({ buffered: true, entryTypes: ["measure"] });
  performance.mark("start");
  const browser = await playwright.chromium.launch({ headless: true });
  const resultFile = await mergePDFs(
    await getPagesAsPDFDocuments(
      PAGES,
      browser
    )
  );
  await browser.close();

  performance.mark("stop");
  performance.measure("Business Logic", "start", "stop");
  const toServe = Buffer.from(resultFile);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="test.pdf"');
  res.send(toServe);
};

export default handler;
