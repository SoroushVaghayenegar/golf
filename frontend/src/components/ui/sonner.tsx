'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="top-center"
      expand
      duration={3500}
    />
  )
}

export default Toaster


