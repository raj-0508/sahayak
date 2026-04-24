"use client"

import * as React from "react"
import * as LabelPrimitiveRaw from "@radix-ui/react-label"
const LabelPrimitive = LabelPrimitiveRaw as any
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<any>,
  React.ComponentPropsWithoutRef<any> &
    VariantProps<typeof labelVariants> & { children?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref as any}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
