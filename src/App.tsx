import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/AuthProvider'
import { router } from '@/app/router'
import { OfstedModeProvider } from '@/features/ofsted-mode/OfstedModeProvider'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfstedModeProvider>
          <RouterProvider router={router} />
        </OfstedModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
