import { jsPDF } from "jspdf"

interface SaleData {
  product_name: string
  quantity_sold: number
  unit_price: number
  total_amount: number
  cost_price?: number
}

interface ReportData {
  businessName: string
  businessLocation?: string
  businessPhone?: string
  ownerEmail?: string
  totalRevenue: number
  totalCost: number
  grossProfit: number
  profitMargin: number
  products: SaleData[]
  reportDate: string
  currency: string
  symbol: string
  profitPercentage?: number
}

const getCurrencySymbol = (currency: string): string => {
  // Map currency codes to plain ASCII-compatible symbols
  const currencyMap: Record<string, string> = {
    GHS: "GHS ", // Ghana Cedi - use code instead of ₵
    USD: "$",
    EUR: "EUR ",
    GBP: "GBP ",
    NGN: "NGN ", // Naira
    KES: "KES ", // Kenya Shilling
    ZAR: "R", // South African Rand
    XOF: "CFA ", // West African CFA
    XAF: "CFA ", // Central African CFA
  }
  return currencyMap[currency] || currency + " "
}

export const generateSalesPDF = async (reportData: ReportData) => {
  console.log("[v0] PDF Generation started with data:", {
    businessName: reportData.businessName,
    productCount: reportData.products?.length || 0,
    totalRevenue: reportData.totalRevenue,
  })

  if (!reportData.products || reportData.products.length === 0) {
    console.error("[v0] PDF Generation Error: No sales data available")
    console.error("[v0] Report data received:", reportData)
    alert("No sales data available to generate report. Please record some sales first.")
    return
  }

  // Validate required report data
  if (!reportData.businessName) {
    console.error("[v0] PDF Generation Error: Business name missing")
    alert("Business information is incomplete. Please update your business details in settings.")
    return
  }

  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20 // Increased margin for better spacing
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    const currencySymbol = getCurrencySymbol(reportData.currency)

    const formatCurrency = (value: number): string => {
      return `${currencySymbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const addText = (
      text: string,
      fontSize = 12,
      isBold = false,
      align: "left" | "center" | "right" = "center", // Default to center
      maxWidth?: number,
    ) => {
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", isBold ? "bold" : "normal")

      const effectiveMaxWidth = maxWidth || contentWidth

      // Check for page break
      if (yPosition + 10 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }

      // Calculate x position based on alignment
      let xPosition = margin
      if (align === "center") {
        xPosition = pageWidth / 2
      } else if (align === "right") {
        xPosition = pageWidth - margin
      }

      // Split text for wrapping
      const lines = doc.splitTextToSize(text, effectiveMaxWidth)
      doc.text(lines, xPosition, yPosition, { align: align, maxWidth: effectiveMaxWidth })

      // Adjust y position based on number of lines
      yPosition += lines.length * (fontSize * 0.4) + 3
    }

    const addLine = () => {
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
    }

    // =====================
    // HEADER SECTION - Centered
    // =====================
    addText(reportData.businessName, 22, true, "center")
    addText(
      `${reportData.businessLocation || "Location"} | Tel: ${reportData.businessPhone || "N/A"}`,
      10,
      false,
      "center",
    )
    if (reportData.ownerEmail) {
      addText(`Owner: ${reportData.ownerEmail}`, 10, false, "center")
    }

    yPosition += 8
    addLine()
    yPosition += 3

    // =====================
    // REPORT TITLE - Centered
    // =====================
    addText("DETAILED SALES ANALYSIS REPORT", 16, true, "center")
    addText(`Annual Sales Report - Year ${new Date().getFullYear()}`, 11, false, "center")

    yPosition += 10

    // =====================
    // EXECUTIVE SUMMARY - Centered
    // =====================
    addText("EXECUTIVE SUMMARY", 13, true, "center")
    yPosition += 2

    const totalQuantity = reportData.products.reduce((sum, p) => sum + p.quantity_sold, 0)
    const profitPercentage =
      reportData.totalCost > 0 ? ((reportData.totalRevenue - reportData.totalCost) / reportData.totalCost) * 100 : 0

    addText(
      `This comprehensive sales analysis report provides detailed insights into product performance, revenue generation, cost management, and profitability for ${reportData.businessName} during the period Year ${new Date().getFullYear()}.`,
      10,
      false,
      "center",
    )

    yPosition += 3
    addText(
      `Period Highlights: Total revenue of ${formatCurrency(reportData.totalRevenue)} was generated from ${totalQuantity} units sold across ${reportData.products.length} products, resulting in a gross profit of ${formatCurrency(reportData.grossProfit)} with an average profit margin of ${reportData.profitMargin.toFixed(2)}% and profit percentage of ${profitPercentage.toFixed(2)}%.`,
      10,
      false,
      "center",
    )

    yPosition += 10
    addLine()
    yPosition += 5

    // =====================
    // KEY PERFORMANCE METRICS - Grid Layout, Centered
    // =====================
    addText("I. KEY PERFORMANCE METRICS", 13, true, "center")
    yPosition += 5

    doc.setFontSize(10)
    const metricsData = [
      { label: "TOTAL REVENUE", value: formatCurrency(reportData.totalRevenue) },
      { label: "TOTAL COST", value: formatCurrency(reportData.totalCost) },
      { label: "GROSS PROFIT", value: formatCurrency(reportData.grossProfit) },
      { label: "PROFIT MARGIN", value: `${reportData.profitMargin.toFixed(2)}%` },
      { label: "PROFIT %", value: `${profitPercentage.toFixed(2)}%` },
    ]

    // Draw metrics in a centered 3-column grid
    const colWidth = contentWidth / 3
    const startX = margin

    metricsData.forEach((metric, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const xPos = startX + col * colWidth + colWidth / 2

      if (row > 0 && col === 0) {
        yPosition += 15
      }

      doc.setFont("helvetica", "bold")
      doc.text(metric.label, xPos, yPosition + row * 15, { align: "center" })
      doc.setFont("helvetica", "normal")
      doc.text(metric.value, xPos, yPosition + row * 15 + 5, { align: "center" })
    })

    yPosition += 25
    addLine()
    yPosition += 5

    // =====================
    // DETAILED PRODUCT PERFORMANCE TABLE
    // =====================
    addText("II. DETAILED PRODUCT PERFORMANCE ANALYSIS", 13, true, "center")
    yPosition += 5

    // Total width = 170 (pageWidth 210 - margins 40)
    const colWidths = [35, 18, 25, 25, 27, 25, 18] // Total: 173, fits within margins
    const headers = ["Product Name", "Qty", "Unit Price", "Unit Cost", "Revenue", "Cost", "Margin"]

    // Table header
    doc.setFontSize(8) // Reduced font size for better fit
    doc.setFont("helvetica", "bold")
    let xPos = margin
    headers.forEach((header, i) => {
      doc.text(header, xPos + colWidths[i] / 2, yPosition, { align: "center", maxWidth: colWidths[i] - 1 })
      xPos += colWidths[i]
    })

    yPosition += 5
    doc.setDrawColor(100, 100, 100)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 4

    // Table rows
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7) // Reduced font size for table content

    reportData.products.forEach((product) => {
      const totalProductCost = (product.cost_price || 0) * product.quantity_sold
      const productGrossProfit = product.total_amount - totalProductCost
      const marginPct =
        product.total_amount > 0 ? ((productGrossProfit / product.total_amount) * 100).toFixed(1) : "0.0"

      const rowData = [
        product.product_name.length > 14 ? product.product_name.substring(0, 14) + ".." : product.product_name,
        product.quantity_sold.toString(),
        formatCurrency(product.unit_price),
        formatCurrency(product.cost_price || 0),
        formatCurrency(product.total_amount),
        formatCurrency(totalProductCost),
        `${marginPct}%`,
      ]

      xPos = margin
      rowData.forEach((data, i) => {
        doc.text(data, xPos + colWidths[i] / 2, yPosition, { align: "center", maxWidth: colWidths[i] - 1 })
        xPos += colWidths[i]
      })

      yPosition += 5 // Reduced row spacing

      // Page break check
      if (yPosition > pageHeight - margin * 3) {
        doc.addPage()
        yPosition = margin
      }
    })

    // Grand total row - Removed extra spacing before line
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 4

    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)

    const totalQuantitySold = reportData.products.reduce((sum, p) => sum + p.quantity_sold, 0)
    const weightedAvgUnitPrice = totalQuantitySold > 0 ? reportData.totalRevenue / totalQuantitySold : 0
    const weightedAvgUnitCost = totalQuantitySold > 0 ? reportData.totalCost / totalQuantitySold : 0

    const grandTotalData = [
      "GRAND TOTAL",
      totalQuantitySold.toString(),
      formatCurrency(weightedAvgUnitPrice), // Show weighted average instead of "--"
      formatCurrency(weightedAvgUnitCost), // Show weighted average instead of "--"
      formatCurrency(reportData.totalRevenue),
      formatCurrency(reportData.totalCost),
      `${reportData.profitMargin.toFixed(1)}%`,
    ]

    xPos = margin
    grandTotalData.forEach((data, i) => {
      doc.text(data, xPos + colWidths[i] / 2, yPosition, { align: "center", maxWidth: colWidths[i] - 1 })
      xPos += colWidths[i]
    })

    yPosition += 8 // Reduced spacing after grand total
    addLine()
    yPosition += 5

    // =====================
    // PERFORMANCE HIGHLIGHTS - Centered
    // =====================
    addText("III. PERFORMANCE HIGHLIGHTS", 13, true, "center")
    yPosition += 3

    // Sort products by profit
    const sortedByProfit = [...reportData.products].sort((a, b) => {
      const profitA = a.total_amount - (a.cost_price || 0) * a.quantity_sold
      const profitB = b.total_amount - (b.cost_price || 0) * b.quantity_sold
      return profitB - profitA
    })

    const displayCount = Math.min(3, sortedByProfit.length)

    addText(`Top ${displayCount} Most Profitable Products`, 11, true, "center")
    for (let i = 0; i < displayCount; i++) {
      const product = sortedByProfit[i]
      const profit = product.total_amount - (product.cost_price || 0) * product.quantity_sold
      const marginPct = product.total_amount > 0 ? ((profit / product.total_amount) * 100).toFixed(1) : "0.0"
      addText(
        `${i + 1}. ${product.product_name} - ${formatCurrency(profit)} profit (${marginPct}% margin)`,
        9,
        false,
        "center",
      )
    }

    yPosition += 3

    addText(`Bottom ${displayCount} Performers (Lowest Profit)`, 11, true, "center")
    for (let i = 0; i < displayCount; i++) {
      const product = sortedByProfit[sortedByProfit.length - 1 - i]
      if (product) {
        const profit = product.total_amount - (product.cost_price || 0) * product.quantity_sold
        const marginPct = product.total_amount > 0 ? ((profit / product.total_amount) * 100).toFixed(1) : "0.0"
        addText(
          `${i + 1}. ${product.product_name} - ${formatCurrency(profit)} profit (${marginPct}% margin)`,
          9,
          false,
          "center",
        )
      }
    }

    yPosition += 8

    // =====================
    // BUSINESS INTELLIGENCE INSIGHTS - Centered
    // =====================
    addText("IV. BUSINESS INTELLIGENCE INSIGHTS", 13, true, "center")
    yPosition += 3

    const topProduct = sortedByProfit[0]
    const topProfit = topProduct.total_amount - (topProduct.cost_price || 0) * topProduct.quantity_sold

    addText(`Best Seller: ${topProduct.product_name} with ${topProduct.quantity_sold} units sold`, 10, false, "center")
    addText(
      `Most Profitable: ${topProduct.product_name} generating ${formatCurrency(topProfit)} profit`,
      10,
      false,
      "center",
    )
    addText(`Average Profit Margin: ${reportData.profitMargin.toFixed(2)}% across all products`, 10, false, "center")
    addText(`Profit Percentage: ${profitPercentage.toFixed(2)}% (Revenue - Cost) / Cost`, 10, false, "center")
    addText(
      `Revenue Performance: ${reportData.grossProfit > 0 ? "Profitable operations" : "Loss-making operations"}`,
      10,
      false,
      "center",
    )
    addText(
      `Recommendation: ${reportData.profitMargin > 50 ? "Excellent profitability - maintain current strategy" : reportData.profitMargin > 20 ? "Good performance - optimize costs where possible" : "Review pricing and cost management"}`,
      10,
      false,
      "center",
    )

    // Page break before certification
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    yPosition += 10
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition - 5, contentWidth, 60, "F")
    yPosition += 5

    // =====================
    // REPORT CERTIFICATION - Centered
    // =====================
    addText("REPORT CERTIFICATION", 12, true, "center")
    yPosition += 2

    addText(
      `This sales analysis report has been generated from verified transaction records of ${reportData.businessName}. All product data, revenue figures, and profit margins are calculated as of the report generation time.`,
      8,
      false,
      "center",
    )

    yPosition += 3

    addText("IMPORTANT: Cost Price Verification Required", 9, true, "center")
    addText(
      `Cost calculations in this report are based on the current cost price stored in the products database at the time of report generation. Please verify cost figures against purchase invoices before using for financial decisions.`,
      8,
      false,
      "center",
    )

    yPosition += 10

    // =====================
    // FOOTER - Centered
    // =====================
    addText(`Report Generated: ${new Date().toLocaleString()}`, 8, false, "center")
    addText(`Document ID: ${Math.random().toString(36).substring(2, 9).toUpperCase()}`, 8, false, "center")
    addText("System: SmartStocks Pro Enterprise", 8, false, "center")
    addText("Prepared By: Sales Analytics System", 8, false, "center")
    addText(`Reviewed By: ${reportData.ownerEmail || "Business Owner"}`, 8, false, "center")

    yPosition += 8

    addText(
      `${reportData.businessName} | Detailed Sales Analysis | Year ${new Date().getFullYear()}`,
      7,
      false,
      "center",
    )
    addText(
      "Confidential Business Document - For Internal Use and Authorized Financial Institutions Only",
      7,
      false,
      "center",
    )

    // Generate filename with business name
    const sanitizedName = reportData.businessName.replace(/[^a-zA-Z0-9]/g, "-").toUpperCase()
    const sanitizedPhone = (reportData.businessPhone || "REPORT").replace(/[^0-9]/g, "")
    const filename = `${sanitizedName}-${sanitizedPhone}-${reportData.reportDate}.pdf`

    // Save PDF with error handling
    try {
      doc.save(filename)
      console.log("[v0] PDF generated successfully:", filename)
    } catch (saveError) {
      console.error("[v0] Error saving PDF:", saveError)
      alert("Failed to save PDF file. Please try again or check your browser's download settings.")
    }
  } catch (error) {
    console.error("[v0] PDF Generation Error:", error)
    alert("An error occurred while generating the PDF. Please try again.")
  }
}
