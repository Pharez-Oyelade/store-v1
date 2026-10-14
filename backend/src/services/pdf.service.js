import puppeteer from "puppeteer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Detect available browser executable paths with fallback to system browsers
 */
const getExecutablePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Windows system paths
  const edgePaths = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  for (const p of [...edgePaths, ...chromePaths]) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }

  // Linux standard paths (Render / Railway / Docker)
  const linuxPaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  for (const p of linuxPaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }

  return undefined; // default to bundled Puppeteer chromium
};

let browserInstance = null;
let browserLaunchPromise = null;

/**
 * Get or initialize singleton Puppeteer browser instance
 */
export const getBrowser = async () => {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    try {
      const execPath = getExecutablePath();
      const uniqueUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vendra-puppeteer-"));

      const launchOptions = {
        headless: true,
        userDataDir: uniqueUserDataDir,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-background-networking",
          "--disable-extensions",
          "--disable-sync",
          "--disable-gpu",
          "--disable-crash-reporter",
          "--disable-breakpad",
          "--disable-software-rasterizer",
          "--mute-audio",
        ],
      };

      if (execPath) {
        launchOptions.executablePath = execPath;
      }

      let browser;
      try {
        browser = await puppeteer.launch(launchOptions);
      } catch (launchErr) {
        if (launchErr.message && launchErr.message.includes("Could not find Chrome")) {
          console.warn("[PDF Service] Chrome not detected in cache. Triggering on-demand browser installation...");
          const { downloadBrowsers } = await import("puppeteer/internal/node/install.js");
          await downloadBrowsers();
          console.log("[PDF Service] Chrome downloaded successfully. Retrying browser launch...");
          browser = await puppeteer.launch(launchOptions);
        } else {
          throw launchErr;
        }
      }

      browser.on("disconnected", () => {
        browserInstance = null;
        browserLaunchPromise = null;
        try {
          fs.rmSync(uniqueUserDataDir, { recursive: true, force: true });
        } catch {
          // ignore cleanup error
        }
      });

      browserInstance = browser;
      browserLaunchPromise = null;
      return browser;
    } catch (err) {
      browserLaunchPromise = null;
      console.error("[PDF Service] Failed to launch Puppeteer browser:", err.message);
      throw err;
    }
  })();

  return browserLaunchPromise;
};

/**
 * Format currency in Nigerian Naira
 */
const formatNaira = (amount = 0) => {
  return Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

/**
 * Sanitize text to prevent HTML injection in templates
 */
const escapeHtml = (str = "") => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Common Print CSS Rules ensuring strict Single-Page layout on A4
 */
const COMMON_CSS = `
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-wrapper {
    width: 100%;
    max-height: 275mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 14px;
    border-bottom: 2px solid #0D6B31;
    margin-bottom: 12px;
  }
  .brand-block {
    max-width: 55%;
  }
  .brand-logo {
    max-height: 44px;
    max-width: 160px;
    object-fit: contain;
    margin-bottom: 6px;
  }
  .brand-title {
    font-size: 18px;
    font-weight: 800;
    color: #0D6B31;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }
  .brand-sub {
    font-size: 10px;
    color: #4b5563;
    line-height: 1.3;
    margin-top: 2px;
  }
  .doc-meta {
    text-align: right;
  }
  .doc-type {
    font-size: 20px;
    font-weight: 900;
    color: #111827;
    letter-spacing: 0.05em;
  }
  .doc-number {
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    margin-top: 2px;
  }
  .meta-row {
    font-size: 10px;
    color: #4b5563;
    margin-top: 3px;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 6px;
  }
  .badge-paid {
    background-color: #d1fae5;
    color: #065f46;
  }
  .badge-partially-paid {
    background-color: #dbeafe;
    color: #1e40af;
  }
  .badge-due {
    background-color: #fef3c7;
    color: #92400e;
  }
  .badge-cancelled {
    background-color: #fee2e2;
    color: #991b1b;
  }
  .info-grid {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 14px;
  }
  .info-col {
    flex: 1;
  }
  .info-label {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 3px;
  }
  .info-name {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
  }
  .info-text {
    font-size: 10px;
    color: #4b5563;
    line-height: 1.35;
  }
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  table.items-table th {
    background: #111827;
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 10px;
    text-align: left;
  }
  table.items-table th.num {
    text-align: right;
  }
  table.items-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 10px;
    color: #374151;
  }
  table.items-table td.num {
    text-align: right;
  }
  table.items-table tr:nth-child(even) td {
    background: #f9fafb;
  }
  .item-title {
    font-weight: 700;
    color: #111827;
  }
  .item-variant {
    font-size: 9px;
    color: #6b7280;
    margin-top: 1px;
  }
  .summary-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
  }
  .payment-instructions {
    flex: 1;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .bank-title {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: #166534;
    margin-bottom: 4px;
  }
  .bank-row {
    font-size: 9.5px;
    color: #1f2937;
    margin-bottom: 2px;
  }
  .bank-row strong {
    color: #111827;
  }
  .totals-box {
    width: 250px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 12px;
    font-size: 10px;
    border-bottom: 1px solid #f3f4f6;
  }
  .total-row.highlight {
    background: #f9fafb;
    font-weight: 700;
    color: #111827;
  }
  .total-row.grand {
    background: #0D6B31;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    padding: 8px 12px;
  }
  .total-row.balance {
    background: #fffbeb;
    color: #92400e;
    font-size: 11px;
    font-weight: 800;
    padding: 7px 12px;
    border-bottom: none;
  }
  .total-row.balance-settled {
    background: #ecfdf5;
    color: #065f46;
    font-size: 11px;
    font-weight: 800;
    padding: 7px 12px;
    border-bottom: none;
  }
  .notes-terms {
    background: #ffffff;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 12px;
    font-size: 9px;
    color: #4b5563;
    line-height: 1.35;
  }
  .footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    color: #9ca3af;
  }
  .watermark {
    font-weight: 700;
    color: #0D6B31;
  }
`;

/**
 * Generate Single-Page HTML for Invoice
 */
export const buildInvoiceHtml = (invoice, vendor = {}) => {
  const isPaid = invoice.status === "paid" || invoice.balanceDue <= 0;
  const isPartiallyPaid = invoice.status === "partially_paid" || (invoice.totalPaid > 0 && !isPaid);

  let badgeClass = "badge-due";
  let badgeText = "PAYMENT DUE";
  if (isPaid) {
    badgeClass = "badge-paid";
    badgeText = "PAID IN FULL";
  } else if (isPartiallyPaid) {
    badgeClass = "badge-partially-paid";
    badgeText = "PARTIALLY PAID";
  } else if (invoice.status === "cancelled") {
    badgeClass = "badge-cancelled";
    badgeText = "CANCELLED";
  }

  const vendorName = escapeHtml(vendor.businessName || "Vendra Store");
  const vendorEmail = escapeHtml(vendor.email || "");
  const vendorPhone = escapeHtml(vendor.phone || "");
  const vendorLocation = escapeHtml(
    [vendor.location?.area, vendor.location?.city, vendor.location?.state].filter(Boolean).join(", ")
  );

  const customerName = escapeHtml(invoice.customerSnapshot?.name || "Customer");
  const customerPhone = escapeHtml(invoice.customerSnapshot?.phone || "");
  const customerEmail = escapeHtml(invoice.customerSnapshot?.email || "");
  const customerAddress = escapeHtml(invoice.customerSnapshot?.address || "");

  const bankName = escapeHtml(vendor.payoutAccount?.bankName || "Direct Bank Transfer");
  const accountNumber = escapeHtml(vendor.payoutAccount?.accountNumber || "Contact Merchant");
  const accountName = escapeHtml(vendor.payoutAccount?.accountName || vendor.businessName || "Merchant");

  const itemsHtml = (invoice.items || [])
    .map(
      (item) => `
      <tr>
        <td>
          <div class="item-title">${escapeHtml(item.description)}</div>
          ${item.variantLabel ? `<div class="item-variant">${escapeHtml(item.variantLabel)}</div>` : ""}
        </td>
        <td class="num">${item.quantity || 1}</td>
        <td class="num">₦${formatNaira(item.unitPrice)}</td>
        <td class="num">₦${formatNaira(item.subtotal)}</td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    ${COMMON_CSS}
  </style>
</head>
<body>
  <div class="doc-wrapper">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="brand-block">
          ${vendor.logo?.url ? `<img src="${vendor.logo.url}" class="brand-logo" alt="Logo" />` : ""}
          <div class="brand-title">${vendorName}</div>
          ${vendorLocation ? `<div class="brand-sub">${vendorLocation}</div>` : ""}
          ${vendorPhone ? `<div class="brand-sub">Tel: ${vendorPhone}</div>` : ""}
          ${vendorEmail ? `<div class="brand-sub">Email: ${vendorEmail}</div>` : ""}
        </div>
        <div class="doc-meta">
          <div class="doc-type">INVOICE</div>
          <div class="doc-number">#${escapeHtml(invoice.invoiceNumber)}</div>
          <div class="meta-row"><strong>Issued:</strong> ${formatDate(invoice.createdAt)}</div>
          ${invoice.dueDate ? `<div class="meta-row"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>` : ""}
          <div><span class="badge ${badgeClass}">${badgeText}</span></div>
        </div>
      </div>

      <!-- Bill To Info Grid -->
      <div class="info-grid">
        <div class="info-col">
          <div class="info-label">Billed To</div>
          <div class="info-name">${customerName}</div>
          ${customerPhone ? `<div class="info-text">Tel: ${customerPhone}</div>` : ""}
          ${customerEmail ? `<div class="info-text">Email: ${customerEmail}</div>` : ""}
          ${customerAddress ? `<div class="info-text">Address: ${customerAddress}</div>` : ""}
        </div>
        <div class="info-col">
          <div class="info-label">Payment Overview</div>
          <div class="info-text">Total Invoiced: <strong>₦${formatNaira(invoice.totalAmount)}</strong></div>
          <div class="info-text">Total Cleared: <strong>₦${formatNaira(invoice.totalPaid)}</strong></div>
          <div class="info-text">Balance Remaining: <strong style="color: ${invoice.balanceDue > 0 ? '#b45309' : '#059669'};">₦${formatNaira(invoice.balanceDue)}</strong></div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="num" style="width: 50px;">Qty</th>
            <th class="num" style="width: 100px;">Unit Price</th>
            <th class="num" style="width: 110px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Summary & Bank Details Section -->
      <div class="summary-section">
        <div class="payment-instructions">
          <div class="bank-title">Bank Settlement Details</div>
          <div class="bank-row">Bank: <strong>${bankName}</strong></div>
          <div class="bank-row">Account No: <strong>${accountNumber}</strong></div>
          <div class="bank-row">Account Name: <strong>${accountName}</strong></div>
          <div style="font-size: 8.5px; color: #15803d; margin-top: 4px;">
            Please include invoice number <strong>${escapeHtml(invoice.invoiceNumber)}</strong> in your payment reference.
          </div>
        </div>

        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₦${formatNaira(invoice.totalAmount)}</span>
          </div>
          ${
            invoice.totalPaid > 0
              ? `
          <div class="total-row highlight">
            <span>Deposits / Paid:</span>
            <span style="color: #059669;">-₦${formatNaira(invoice.totalPaid)}</span>
          </div>`
              : ""
          }
          <div class="total-row grand">
            <span>Total Invoiced:</span>
            <span>₦${formatNaira(invoice.totalAmount)}</span>
          </div>
          <div class="total-row ${invoice.balanceDue <= 0 ? "balance-settled" : "balance"}">
            <span>${invoice.balanceDue <= 0 ? "Settled Balance:" : "Balance Due:"}</span>
            <span>${invoice.balanceDue <= 0 ? "₦0.00 (PAID)" : `₦${formatNaira(invoice.balanceDue)}`}</span>
          </div>
        </div>
      </div>

      ${
        invoice.notes || invoice.terms
          ? `
      <!-- Notes & Terms -->
      <div class="notes-terms">
        ${invoice.notes ? `<div><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</div>` : ""}
        ${invoice.terms ? `<div style="margin-top: 2px;"><strong>Terms:</strong> ${escapeHtml(invoice.terms)}</div>` : ""}
      </div>`
          : ""
      }
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Thank you for choosing ${vendorName}! This invoice was electronically generated and is valid without a physical signature.</div>
      <div>${invoice.isWatermarked ? `<span class="watermark">Powered by Vendra</span>` : ""} Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Generate Single-Page HTML for Payment Receipt
 */
export const buildReceiptHtml = (invoice, vendor = {}, payment = null) => {
  const vendorName = escapeHtml(vendor.businessName || "Vendra Store");
  const vendorEmail = escapeHtml(vendor.email || "");
  const vendorPhone = escapeHtml(vendor.phone || "");
  const vendorLocation = escapeHtml(
    [vendor.location?.area, vendor.location?.city, vendor.location?.state].filter(Boolean).join(", ")
  );

  const customerName = escapeHtml(invoice.customerSnapshot?.name || "Customer");
  const customerPhone = escapeHtml(invoice.customerSnapshot?.phone || "");
  const customerEmail = escapeHtml(invoice.customerSnapshot?.email || "");

  // Determine payment record: specific payment or aggregate receipt
  const paymentAmount = payment ? payment.amount : invoice.totalPaid;
  const paymentRef = payment
    ? payment.reference
    : `REC-${invoice.invoiceNumber.replace(/^INV-/, "")}-${Date.now().toString().slice(-4)}`;
  const paymentDate = payment ? payment.paidAt : new Date();
  const paymentChannel = payment
    ? payment.channel?.replace("_", " ").toUpperCase()
    : "VERIFIED SETTLEMENT";
  const verifiedBy = payment?.verifiedBy === "paystack" ? "Paystack Verified" : "Merchant Confirmed";

  const isFullySettled = invoice.balanceDue <= 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${paymentRef}</title>
  <style>
    ${COMMON_CSS}
    .receipt-hero {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 18px 24px;
      text-align: center;
      margin-bottom: 16px;
    }
    .receipt-amount-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #065f46;
    }
    .receipt-amount-val {
      font-size: 32px;
      font-weight: 900;
      color: #065f46;
      margin: 4px 0;
    }
    .receipt-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #059669;
      color: #ffffff;
    }
    .grid-two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .card-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
    }
    .card-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 5px;
    }
    .detail-label {
      color: #6b7280;
    }
    .detail-val {
      font-weight: 700;
      color: #111827;
      text-align: right;
    }
    .seal-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px;
      margin-top: 6px;
    }
    .official-seal {
      border: 2px dashed #059669;
      border-radius: 8px;
      padding: 8px 24px;
      text-align: center;
      color: #059669;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transform: rotate(-1deg);
    }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="brand-block">
          ${vendor.logo?.url ? `<img src="${vendor.logo.url}" class="brand-logo" alt="Logo" />` : ""}
          <div class="brand-title">${vendorName}</div>
          ${vendorLocation ? `<div class="brand-sub">${vendorLocation}</div>` : ""}
          ${vendorPhone ? `<div class="brand-sub">Tel: ${vendorPhone}</div>` : ""}
          ${vendorEmail ? `<div class="brand-sub">Email: ${vendorEmail}</div>` : ""}
        </div>
        <div class="doc-meta">
          <div class="doc-type" style="color: #059669;">PAYMENT RECEIPT</div>
          <div class="doc-number">Ref: ${escapeHtml(paymentRef)}</div>
          <div class="meta-row"><strong>Receipt Date:</strong> ${formatDate(paymentDate)}</div>
          <div><span class="badge badge-paid">PAYMENT VERIFIED</span></div>
        </div>
      </div>

      <!-- Receipt Hero Card -->
      <div class="receipt-hero">
        <div class="receipt-amount-label">Official Amount Received</div>
        <div class="receipt-amount-val">₦${formatNaira(paymentAmount)}</div>
        <div>
          <span class="receipt-status-pill">
            ✓ Successfully Cleared & Credited
          </span>
        </div>
      </div>

      <!-- Grid: Transaction & Customer Details -->
      <div class="grid-two">
        <div class="card-box">
          <div class="card-title">Transaction Particulars</div>
          <div class="detail-row">
            <span class="detail-label">Payment Reference:</span>
            <span class="detail-val font-mono">${escapeHtml(paymentRef)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-val">${escapeHtml(paymentChannel)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Date / Time:</span>
            <span class="detail-val">${formatDate(paymentDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Verification Source:</span>
            <span class="detail-val" style="color: #059669;">${escapeHtml(verifiedBy)}</span>
          </div>
          ${
            payment?.notes
              ? `<div class="detail-row">
            <span class="detail-label">Notes:</span>
            <span class="detail-val" style="font-weight: normal; font-style: italic;">${escapeHtml(payment.notes)}</span>
          </div>`
              : ""
          }
        </div>

        <div class="card-box">
          <div class="card-title">Payer Information</div>
          <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span class="detail-val">${customerName}</span>
          </div>
          ${
            customerPhone
              ? `<div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-val">${customerPhone}</span>
          </div>`
              : ""
          }
          ${
            customerEmail
              ? `<div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-val">${customerEmail}</span>
          </div>`
              : ""
          }
          <div class="detail-row">
            <span class="detail-label">Received By:</span>
            <span class="detail-val">${vendorName}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Ledger Status -->
      <div class="card-box" style="margin-bottom: 16px;">
        <div class="card-title">Associated Invoice Summary</div>
        <div class="detail-row">
          <span class="detail-label">Linked Invoice Number:</span>
          <span class="detail-val">#${escapeHtml(invoice.invoiceNumber)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Invoice Value:</span>
          <span class="detail-val">₦${formatNaira(invoice.totalAmount)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Cleared to Date:</span>
          <span class="detail-val" style="color: #059669;">₦${formatNaira(invoice.totalPaid)}</span>
        </div>
        <div class="detail-row" style="border-top: 1px dashed #e5e7eb; padding-top: 6px; margin-top: 4px;">
          <span class="detail-label" style="font-weight: 800; color: #111827;">Outstanding Balance:</span>
          <span class="detail-val" style="font-size: 12px; color: ${isFullySettled ? "#059669" : "#b45309"}; font-weight: 800;">
            ${isFullySettled ? "₦0.00 (SETTLED IN FULL)" : `₦${formatNaira(invoice.balanceDue)}`}
          </span>
        </div>
      </div>

      <!-- Official Stamp -->
      <div class="seal-wrap">
        <div class="official-seal">
          ★ OFFICIAL RECEIPT • ${isFullySettled ? "PAID IN FULL" : "PAYMENT RECORDED"} ★
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Thank you for your business! This official payment voucher was generated by ${vendorName}.</div>
      <div>${invoice.isWatermarked ? `<span class="watermark">Powered by Vendra</span>` : ""} Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Generate PDF buffer from HTML using Puppeteer with single-page layout
 */
export const renderPdfBuffer = async (html) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set standard A4 portrait viewport
    await page.setViewport({
      width: 794, // A4 @ 96dpi approx
      height: 1123,
      deviceScaleFactor: 1.5,
    });

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Generate single-page PDF with precise margins
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "8mm",
        bottom: "8mm",
        left: "10mm",
        right: "10mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
  }
};

/**
 * High-level service: Generate Invoice PDF
 */
export const generateInvoicePdf = async (invoice, vendor) => {
  const html = buildInvoiceHtml(invoice, vendor);
  return renderPdfBuffer(html);
};

/**
 * High-level service: Generate Payment Receipt PDF
 */
export const generateReceiptPdf = async (invoice, vendor, payment = null) => {
  const html = buildReceiptHtml(invoice, vendor, payment);
  return renderPdfBuffer(html);
};

export default {
  getBrowser,
  buildInvoiceHtml,
  buildReceiptHtml,
  renderPdfBuffer,
  generateInvoicePdf,
  generateReceiptPdf,
};
