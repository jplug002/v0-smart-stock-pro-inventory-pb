"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Download, FileText, AlertCircle } from "lucide-react"

interface ImportExportRecord {
  id: string
  type: "import" | "export"
  module: string
  file_name: string
  row_count: number | null
  status: string
  error_message: string | null
  created_at: string
}

export default function ImportExportContent() {
  const [importExports, setImportExports] = useState<ImportExportRecord[]>([])
  const [selectedModule, setSelectedModule] = useState("products")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const modules = [
    { value: "products", label: "Products" },
    { value: "sales", label: "Sales" },
    { value: "suppliers", label: "Suppliers" },
    { value: "expenses", label: "Expenses" },
  ]

  const handleExport = async (format: "csv" | "excel") => {
    setLoading(true)
    setMessage("")

    try {
      let data: any[] = []
      const { data: tableData, error } = await supabase.from(selectedModule).select("*")

      if (error) throw error
      data = tableData || []

      if (data.length === 0) {
        setMessage("No data to export")
        setLoading(false)
        return
      }

      let content = ""
      const fileName = `${selectedModule}-export-${new Date().toISOString().split("T")[0]}`

      if (format === "csv") {
        // Convert to CSV
        const headers = Object.keys(data[0])
        content = headers.join(",") + "\n"
        content += data
          .map((row) =>
            headers
              .map((header) => {
                const value = row[header]
                if (value === null || value === undefined) return ""
                if (typeof value === "string" && value.includes(",")) {
                  return `"${value}"`
                }
                return value
              })
              .join(","),
          )
          .join("\n")

        // Download CSV
        const blob = new Blob([content], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${fileName}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        // For Excel, we'll create a CSV that can be opened in Excel
        // In production, you'd use a library like xlsx
        const headers = Object.keys(data[0])
        content = headers.join("\t") + "\n"
        content += data
          .map((row) =>
            headers
              .map((header) => {
                const value = row[header]
                return value === null || value === undefined ? "" : value
              })
              .join("\t"),
          )
          .join("\n")

        const blob = new Blob([content], { type: "application/vnd.ms-excel" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${fileName}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
      }

      // Log export
      await supabase.from("import_exports").insert([
        {
          type: "export",
          module: selectedModule,
          file_name: `${fileName}.${format}`,
          row_count: data.length,
          status: "completed",
        },
      ])

      setMessage(`Successfully exported ${data.length} records`)
    } catch (error: any) {
      setMessage(`Export failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, format: "csv" | "excel") => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage("")

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("File must contain headers and at least one data row")
      }

      const headers = lines[0].split(format === "csv" ? "," : "\t").map((h) => h.trim().toLowerCase())
      const records: any[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(format === "csv" ? "," : "\t")
        const record: any = {}

        headers.forEach((header, index) => {
          let value = values[index]?.trim() || ""

          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
          }

          // Convert to appropriate type
          if (value === "") {
            record[header] = null
          } else if (!isNaN(Number(value))) {
            record[header] = Number(value)
          } else if (value.toLowerCase() === "true") {
            record[header] = true
          } else if (value.toLowerCase() === "false") {
            record[header] = false
          } else {
            record[header] = value
          }
        })

        records.push(record)
      }

      // Insert records
      const { error } = await supabase.from(selectedModule).insert(records)

      if (error) throw error

      // Log import
      await supabase.from("import_exports").insert([
        {
          type: "import",
          module: selectedModule,
          file_name: file.name,
          row_count: records.length,
          status: "completed",
        },
      ])

      setMessage(`Successfully imported ${records.length} records`)
    } catch (error: any) {
      setMessage(`Import failed: ${error.message}`)
      // Log failed import
      supabase.from("import_exports").insert([
        {
          type: "import",
          module: selectedModule,
          file_name: file.name,
          row_count: 0,
          status: "failed",
          error_message: error.message,
        },
      ])
    } finally {
      setLoading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Import/Export</h1>
        <p className="text-muted-foreground mt-1">Import and export data in CSV and Excel formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {modules.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Button onClick={() => handleExport("csv")} disabled={loading} className="w-full gap-2" variant="outline">
                <FileText className="w-4 h-4" />
                Export as CSV
              </Button>
              <Button
                onClick={() => handleExport("excel")}
                disabled={loading}
                className="w-full gap-2"
                variant="outline"
              >
                <FileText className="w-4 h-4" />
                Export as Excel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Exports all records from the selected module in the chosen format.
            </p>
          </div>
        </Card>

        {/* Import Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {modules.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block">
                <Button asChild className="w-full gap-2 bg-transparent" variant="outline">
                  <span>
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleImport(e, "csv")}
                  disabled={loading}
                  className="hidden"
                />
              </label>

              <label className="block">
                <Button asChild className="w-full gap-2 bg-transparent" variant="outline">
                  <span>
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleImport(e, "excel")}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Import records from CSV or Excel files. Headers must match database column names.
            </p>
          </div>
        </Card>
      </div>

      {message && (
        <Card
          className={`p-4 flex gap-3 ${message.includes("failed") ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
        >
          <AlertCircle
            className={`w-5 h-5 flex-shrink-0 ${message.includes("failed") ? "text-red-600" : "text-green-600"}`}
          />
          <p className={message.includes("failed") ? "text-red-800" : "text-green-800"}>{message}</p>
        </Card>
      )}

      {/* Import/Export History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Import/Export History</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Track all import and export operations. Check the database for detailed history.
        </p>
        <div className="text-center py-8 text-muted-foreground">
          <p>Import/export history will be logged here</p>
        </div>
      </Card>

      {/* Import Template */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Import Template</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Download a template to understand the required format for importing data.
        </p>
        <div className="space-y-2">
          {modules.map((m) => (
            <Button key={m.value} variant="outline" className="w-full justify-start gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              {m.label} Template
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
