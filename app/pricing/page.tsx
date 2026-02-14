// Pricing page route - renders the PricingPage component
import PricingPage from "@/components/pricing/pricing-page"

// Export metadata for SEO
export const metadata = {
  title: "Pricing - SmartStocks Pro",
  description: "Choose the perfect plan for your business. Simple, transparent pricing with no hidden fees.",
}

// Default export renders the pricing component
export default function Pricing() {
  return <PricingPage />
}
