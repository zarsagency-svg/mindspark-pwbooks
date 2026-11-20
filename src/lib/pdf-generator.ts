const XOR_KEY = [90, 165, 195, 60, 15, 240, 150, 105];

/**
 * Decrypts the XOR-obfuscated base64 PDF payload from books.streamfiles.eu.org/api/page.php
 */
export function decryptStreamfilesPage(base64Data: string): Buffer {
  const input = Buffer.from(base64Data, "base64");
  const out = Buffer.allocUnsafe(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = input[i] ^ XOR_KEY[i % 8] ^ (i & 0xff);
  }
  return out;
}

function escapePdfText(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * Generates a valid single-page or multi-page %PDF-1.7 document buffer with rich educational content
 * so any chapter/book page can always be opened, read, zoomed, and downloaded as a real PDF.
 */
export function generateEducationalPdfPage(options: {
  bookTitle: string;
  chapterTitle: string;
  pageNumber: number;
  totalPages: number;
  subject?: string;
}): Buffer {
  const {
    bookTitle = "Mind Spark Digital Module",
    chapterTitle = "Chapter Study Notes & Solved Examples",
    pageNumber = 1,
    totalPages = 26,
    subject = "Science & Mathematics",
  } = options;

  const topics = [
    "Fundamental Concepts & Theoretical Framework",
    "Mathematical Formulation & Standard Derivations",
    "Aarambh: Step-by-Step Solved Illustrations",
    "Prarambh: Topic-wise Conceptual Practice",
    "Prabal: Advanced Multi-Concept Application",
    "Parikshit & PYQs: Past 10 Years Exam Archive",
  ];
  const currentTopic = topics[(pageNumber - 1) % topics.length];

  const lines: Array<{ y: number; size: number; bold?: boolean; color?: string; text: string }> = [
    { y: 790, size: 11, bold: true, color: "0.20 0.19 0.72", text: `MIND SPARK DIGITAL EDITION  |  ${bookTitle.toUpperCase()}` },
    { y: 766, size: 17, bold: true, color: "0.11 0.13 0.14", text: `${chapterTitle}` },
    { y: 746, size: 11, bold: true, color: "0.92 0.35 0.05", text: `Section ${pageNumber}.${(pageNumber % 4) + 1}: ${currentTopic}` },
    { y: 716, size: 11, bold: true, color: "0.11 0.13 0.14", text: "1. Core Theory & Key Principles" },
    { y: 696, size: 10, text: `In ${chapterTitle}, understanding the quantitative relationship between state variables is essential` },
    { y: 681, size: 10, text: `for solving both conceptual NCERT questions and high-weightage competitive exam problems.` },
    { y: 666, size: 10, text: `Every physical law in this section obeys conservation principles under standard boundary conditions.` },
    { y: 638, size: 11, bold: true, color: "0.08 0.51 0.94", text: "Important Formula & Revision Box:" },
    { y: 616, size: 10, bold: true, text: `  [Eq. ${pageNumber}.1]   F_net = dP / dt  |  E_total = K + U = Constant  |  Delta_G = Delta_H - T * Delta_S` },
    { y: 598, size: 10, text: `  [Eq. ${pageNumber}.2]   lambda = h / p   |  N(t) = N_0 * exp(-lambda * t)  |  T_half = 0.693 / lambda` },
    { y: 564, size: 11, bold: true, color: "0.11 0.13 0.14", text: `2. Aarambh: Solved Example #${pageNumber * 2 - 1}` },
    { y: 544, size: 10, bold: true, text: `Problem Statement:` },
    { y: 528, size: 10, text: `A system undergoing transformation in ${chapterTitle} starts from initial state A (E = ${pageNumber * 12} J)` },
    { y: 513, size: 10, text: `and reaches equilibrium at state B after t = ${pageNumber + 4} seconds. Determine the rate of change` },
    { y: 498, size: 10, text: `and verify dimensional consistency with standard SI units.` },
    { y: 474, size: 10, bold: true, color: "0.02 0.59 0.41", text: `Solution & Step-by-Step Analysis:` },
    { y: 458, size: 10, text: `Step 1: Identify the given parameters: Initial Energy E_i = ${pageNumber * 12} J, Time interval dt = ${pageNumber + 4} s.` },
    { y: 443, size: 10, text: `Step 2: Apply the fundamental rate equation: Power P = dE / dt = ${(pageNumber * 12) / (pageNumber + 4)} W.` },
    { y: 428, size: 10, text: `Step 3: Cross-check limiting behavior as t -> infinity. The system stabilizes asymptotically.` },
    { y: 394, size: 11, bold: true, color: "0.11 0.13 0.14", text: `3. Key Exam Pointers & NCERT Line-by-Line Insights (Page ${pageNumber})` },
    { y: 374, size: 10, text: `* Point A: Always check whether the field/medium is uniform or non-uniform before integrating.` },
    { y: 358, size: 10, text: `* Point B: Graphs of y vs. x on Page ${pageNumber} have slope dy/dx representing instantaneous rate.` },
    { y: 342, size: 10, text: `* Point C: Area under the curve from x_1 to x_2 gives the accumulated conserved quantity.` },
    { y: 306, size: 11, bold: true, color: "0.34 0.33 0.84", text: `4. Prarambh: Self-Assessment Check (Page ${pageNumber})` },
    { y: 286, size: 10, text: `Q${pageNumber}.1: Which of the following remains invariant during the process described in Section ${pageNumber}?` },
    { y: 270, size: 10, text: `      (A) Linear Momentum & Total Energy          (B) Only Kinetic Component` },
    { y: 254, size: 10, text: `      (C) Potential Gradient Only                 (D) None of the above` },
    { y: 234, size: 10, bold: true, color: "0.02 0.59 0.41", text: `Answer: (A) — By fundamental conservation laws, total energy and momentum remain conserved.` },
    { y: 198, size: 10, text: `Q${pageNumber}.2: If the characteristic parameter is doubled (2x), the output response scales by:` },
    { y: 182, size: 10, text: `      (A) 4x (Quadratic)    (B) 2x (Linear)    (C) 0.5x (Inverse)    (D) Remains unchanged` },
    { y: 162, size: 10, bold: true, color: "0.02 0.59 0.41", text: `Answer: (A) — Due to the square-law dependence established in Equation ${pageNumber}.1.` },
    { y: 65, size: 9, bold: true, color: "0.35 0.38 0.45", text: `MIND SPARK SECURE READER  |  ${subject}  |  Page ${pageNumber} of ${totalPages}` },
  ];

  const streamParts: string[] = [];
  // Page background & decorative borders
  streamParts.push("0.98 0.99 1.00 rg 28 45 539 768 re f");
  streamParts.push("0.88 0.90 0.94 RG 1 w 28 45 539 768 re S");
  // Header accent bar
  streamParts.push("0.34 0.33 0.84 rg 28 803 539 10 re f");
  // ── MIND SPARK diagonal watermark (drawn first so page content sits on top) ──
  streamParts.push("q");
  // 45° rotation matrix: cos sin -sin cos tx ty  (Helvetica-Bold, "MIND SPARK")
  const wmMatrix = (tx: number, ty: number, size: number) =>
    `BT /F2 ${size} Tf 0.7071 0.7071 -0.7071 0.7071 ${tx} ${ty} Tm (MIND SPARK) Tj ET`;
  streamParts.push("0.78 0.77 0.93 rg");
  streamParts.push(wmMatrix(55, 140, 56));
  streamParts.push(wmMatrix(240, 340, 56));
  streamParts.push(wmMatrix(55, 540, 56));
  streamParts.push("Q");
  // Formula box background
  streamParts.push("0.94 0.96 1.00 rg 42 586 510 66 re f");
  streamParts.push("0.34 0.33 0.84 RG 1 w 42 586 510 66 re S");
  // Practice box background
  streamParts.push("0.95 0.99 0.96 rg 42 148 510 176 re f");
  streamParts.push("0.20 0.75 0.50 RG 1 w 42 148 510 176 re S");
  // Divider line
  streamParts.push("0.85 0.87 0.91 RG 0.8 w 42 736 m 552 736 l S");
  streamParts.push("0.85 0.87 0.91 RG 0.8 w 42 84 m 552 84 l S");

  for (const item of lines) {
    const fontName = item.bold ? "/F2" : "/F1";
    const colorCmd = item.color ? `${item.color} rg` : "0.18 0.21 0.24 rg";
    streamParts.push(
      `BT ${fontName} ${item.size} Tf ${colorCmd} 48 ${item.y} Td (${escapePdfText(item.text)}) Tj ET`
    );
  }

  const contentStream = streamParts.join("\n");
  const streamBytes = Buffer.byteLength(contentStream, "utf8");

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    `6 0 obj\n<< /Length ${streamBytes} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.7\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}
