import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/AuthProvider'
import { ThemeProvider } from '@/app/ThemeProvider'
import { router } from '@/app/router'
import { OfstedModeProvider } from '@/features/ofsted-mode/OfstedModeProvider'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OfstedModeProvider>
            <RouterProvider router={router} />
          </OfstedModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
