const pdfParse = require('pdf-parse');

/**
 * Clean extracted text by removing repetitive header/footer noise and excessive whitespace
 * @param {string} rawText
 * @returns {string}
 */
const cleanText = (rawText) => {
  if (!rawText) return '';

  return (
    rawText
      // Replace carriage returns with standard newlines
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Replace non-breaking spaces and non-standard whitespace
      .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
      // Normalize multiple horizontal spaces to single space
      .replace(/[ \t]+/g, ' ')
      // Remove more than two consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim leading/trailing whitespace
      .trim()
  );
};

/**
 * Extract text from PDF buffer with page-level mapping
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{ pages: Array<{ pageNumber: number, text: string }>, totalPages: number, fullText: string }>}
 */
const extractTextFromPDF = async (pdfBuffer) => {
  const pages = [];

  // Custom pagerender to capture text page by page
  const customPagerender = (pageData) => {
    return pageData.getTextContent().then((textContent) => {
      let pageText = '';
      for (const item of textContent.items) {
        pageText += item.str + (item.hasEOL ? '\n' : ' ');
      }
      const cleaned = cleanText(pageText);
      if (cleaned.length > 0) {
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          text: cleaned,
        });
      }
      return cleaned;
    });
  };

  const options = {
    pagerender: customPagerender,
  };

  const parsed = await pdfParse(pdfBuffer, options);

  const fullText = cleanText(parsed.text);

  // Fallback if pages array is empty
  if (pages.length === 0 && fullText.length > 0) {
    pages.push({
      pageNumber: 1,
      text: fullText,
    });
  }

  return {
    pages,
    totalPages: parsed.numpages || pages.length,
    fullText,
  };
};

module.exports = {
  cleanText,
  extractTextFromPDF,
};
