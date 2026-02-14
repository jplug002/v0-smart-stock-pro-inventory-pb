"use client"

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
  ownerName?: string
  totalRevenue: number
  totalCost: number
  grossProfit: number
  profitMargin: number
  products: SaleData[]
  reportDate: string
  currency: string
  symbol: string
}

export const generateSalesPDF = async (reportData: ReportData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Helper function to add text with automatic page break
  const addText = (text: string, fontSize = 12, isBold = false, align: "left" | "center" | "right" = "left") => {
    doc.setFontSize(fontSize)
    if (isBold) doc.setFont(undefined, "bold")
    else doc.setFont(undefined, "normal")

    const textWidth = (doc.getStringUnitWidth(text) * fontSize) / doc.internal.scaleFactor
    let xPosition = margin

    if (align === "center") xPosition = (pageWidth - textWidth) / 2
    else if (align === "right") xPosition = pageWidth - margin - textWidth

    if (yPosition + 10 > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }

    doc.text(text, xPosition, yPosition)
    yPosition += 7
  }

  // Header with business info
  addText(reportData.businessName, 20, true, "center")
  addText(
    `${reportData.businessLocation || "Location"} | Tel: ${reportData.businessPhone || "N/A"}`,
    10,
    false,
    "center",
  )
  if (reportData.ownerName) {
    addText(`Owner: ${reportData.ownerName}`, 10, false, "center")
  }

  yPosition += 5

  // Report title
  addText("DETAILED SALES ANALYSIS REPORT", 14, true, "center")
  addText(`Annual Sales Report - Year ${new Date().getFullYear()}`, 11, false, "center")

  yPosition += 10

  // Executive Summary
  addText("EXECUTIVE SUMMARY", 12, true)
  const totalQuantity = reportData.products.reduce((sum, p) => sum + p.quantity_sold, 0)
  addText(
    `This comprehensive sales analysis report provides detailed insights into product performance, revenue generation, and profitability. The report includes individual product analysis with quantities sold, revenue generated, and profit margins.`,
    10,
  )
  addText(
    `Period Highlights: Total revenue of ${reportData.symbol}${reportData.totalRevenue.toLocaleString()} was generated from ${totalQuantity} units sold across ${reportData.products.length} products, resulting in a gross profit of ${reportData.symbol}${reportData.grossProfit.toLocaleString()} with an average profit margin of ${reportData.profitMargin.toFixed(2)}%.`,
    10,
  )

  yPosition += 8

  // Key Performance Metrics
  addText("I. KEY PERFORMANCE METRICS", 12, true)
  const metricsText = [
    `TOTAL REVENUE\n${reportData.symbol}${reportData.totalRevenue.toLocaleString()}`,
    `TOTAL COST\n${reportData.symbol}${reportData.totalCost.toLocaleString()}`,
    `GROSS PROFIT\n${reportData.symbol}${reportData.grossProfit.toLocaleString()}`,
    `PROFIT MARGIN\n${reportData.profitMargin.toFixed(2)}%`,
  ]

  const metricsPerRow = 2
  for (let i = 0; i < metricsText.length; i += metricsPerRow) {
    addText(metricsText.slice(i, i + metricsPerRow).join("          "), 10)
  }

  yPosition += 8

  // Products Table
  addText("II. DETAILED PRODUCT PERFORMANCE ANALYSIS", 12, true)

  const tableStartY = yPosition
  const colWidths = [30, 20, 25, 25, 30, 20, 20]
  const headers = ["Product", "Qty", "Unit Price", "Unit Cost", "Revenue", "Cost", "Margin %"]

  // Table header
  doc.setFontSize(10)
  doc.setFont(undefined, "bold")
  let xPos = margin
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPosition, { maxWidth: colWidths[i] - 2 })
    xPos += colWidths[i]
  })

  yPosition += 8
  doc.setFont(undefined, "normal")
  doc.setFontSize(9)

  // Table rows
  reportData.products.forEach((product) => {
    const margin_pct =
      product.total_amount > 0
        ? (
            ((product.total_amount - (product.cost_price || 0) * product.quantity_sold) / product.total_amount) *
            100
          ).toFixed(2)
        : "0.00"

    const rowData = [
      product.product_name.substring(0, 15),
      product.quantity_sold.toString(),
      `${reportData.symbol}${product.unit_price.toFixed(2)}`,
      `${reportData.symbol}${(product.cost_price || 0).toFixed(2)}`,
      `${reportData.symbol}${product.total_amount.toFixed(2)}`,
      `${reportData.symbol}${((product.cost_price || 0) * product.quantity_sold).toFixed(2)}`,
      `${margin_pct}%`,
    ]

    xPos = margin
    rowData.forEach((data, i) => {
      doc.text(data, xPos, yPosition, { maxWidth: colWidths[i] - 2 })
      xPos += colWidths[i]
    })

    yPosition += 6
    if (yPosition > pageHeight - margin * 2) {
      doc.addPage()
      yPosition = margin
    }
  })

  yPosition += 5

  // Footer
  addText("---", 10, false, "center")
  addText(`Report Generated: ${new Date().toLocaleString()}`, 9)
  addText(`Document ID: ${Math.random().toString(36).substring(2, 9).toUpperCase()}`, 9)
  addText("System: SmartStocks Pro Enterprise", 9)
  addText("Confidential Business Document - For Internal Use Only", 9)

  // Save PDF
  doc.save(`sales-report-${new Date().toISOString().split("T")[0]}.pdf`)
}
