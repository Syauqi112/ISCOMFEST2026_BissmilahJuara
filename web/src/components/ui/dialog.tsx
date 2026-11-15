"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-[#0b1628]/30 transition-opacity duration-200 ease-out supports-backdrop-filter:backdrop-blur-xs data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[88svh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-[28px] bg-white p-6 text-[15px] text-foreground shadow-[0_30px_80px_-30px_rgba(11,22,40,.65)] outline-none md:p-7 [&_[data-slot=button]]:rounded-full [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-xl [&_[data-slot=input]]:border-[#d5dce8] [&_[data-slot=input]]:bg-white [&_[data-slot=input]]:text-[16px] [&_[data-slot=select-trigger]]:h-12! [&_[data-slot=select-trigger]]:rounded-xl [&_[data-slot=select-trigger]]:border-[#d5dce8] [&_label]:text-[15px] [&_label]:font-semibold transition-[opacity,scale,translate] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] sm:max-w-sm data-[starting-style]:translate-y-[calc(-50%+12px)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-[calc(-50%+12px)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 size-10 rounded-full text-[#5a6782] hover:bg-[#eef2f8] hover:text-primary md:top-5 md:right-5"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 pr-10", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end [&_[data-slot=button]]:h-12 [&_[data-slot=button]]:px-6 [&_[data-slot=button]]:text-[16px]",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-[22px] leading-tight font-bold tracking-[-0.02em] text-primary",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-[15px] leading-relaxed text-[#5a6782] *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
