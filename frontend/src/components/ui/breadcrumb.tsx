import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

export type BreadcrumbProps = React.HTMLAttributes<HTMLElement>

export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={cn("w-full", className)} {...props} />
  )
}

export type BreadcrumbListProps = React.OlHTMLAttributes<HTMLOListElement>

export function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export type BreadcrumbItemProps = React.LiHTMLAttributes<HTMLLIElement>

export function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />
}

export interface BreadcrumbLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean
}

export function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      className={cn(
        "transition-colors hover:text-foreground text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export type BreadcrumbPageProps = React.HTMLAttributes<HTMLSpanElement>

export function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span className={cn("font-medium text-foreground", className)} {...props} />
  )}

export type BreadcrumbSeparatorProps = React.LiHTMLAttributes<HTMLLIElement>

export function BreadcrumbSeparator({ className, children, ...props }: BreadcrumbSeparatorProps) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRight className="text-muted-foreground" />}
    </li>
  )
}

export type BreadcrumbEllipsisProps = React.HTMLAttributes<HTMLSpanElement>

export function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} {...props}>
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}


