"use client"

import type React from "react"

// Business PIN Input Component
// A reusable 4-digit PIN input with individual boxes for each digit

import { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BusinessPinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
}

export function BusinessPinInput({
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: BusinessPinInputProps) {
  // State to toggle PIN visibility
  const [showPin, setShowPin] = useState(false)

  // Refs for each input box to manage focus
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Split current value into individual digits
  const digits = value.split("").slice(0, 4)
  while (digits.length < 4) digits.push("")

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs[0].current) {
      inputRefs[0].current.focus()
    }
  }, [autoFocus])

  // Handle input change for each digit box
  const handleDigitChange = (index: number, digitValue: string) => {
    // Only allow numeric input
    if (digitValue && !/^\d$/.test(digitValue)) return

    // Build new PIN value
    const newDigits = [...digits]
    newDigits[index] = digitValue
    const newValue = newDigits.join("")
    onChange(newValue)

    // Auto-advance to next input if digit entered
    if (digitValue && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  // Handle backspace to move to previous input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  // Handle paste to fill all digits at once
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    onChange(pastedData)

    // Focus the appropriate input after paste
    const focusIndex = Math.min(pastedData.length, 3)
    inputRefs[focusIndex].current?.focus()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 justify-center">
        {/* Four individual digit inputs */}
        {[0, 1, 2, 3].map((index) => (
          <Input
            key={index}
            ref={inputRefs[index]}
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={1}
            value={digits[index]}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-14 h-14 text-center text-2xl font-bold bg-slate-800 border-2 
              ${error ? "border-red-500" : "border-slate-600 focus:border-blue-500"} 
              text-foreground rounded-lg`}
            aria-label={`PIN digit ${index + 1}`}
          />
        ))}

        {/* Toggle visibility button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowPin(!showPin)}
          className="ml-2"
          aria-label={showPin ? "Hide PIN" : "Show PIN"}
        >
          {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}
