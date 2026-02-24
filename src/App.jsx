import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "./components/ui/toaster"

// Layout e Login
import Layout from './Layout'
import Login from './pages/Login'

// Páginas
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import ImportEmployees from './pages/ImportEmployees'
import Units from './pages/Units'
import MonthlyLogs from './pages/MonthlyLogs' 
import Users from './pages/Users' // <-- NOSSA TELA NOVA AQUI
import Occurrences from './pages/Occurrences'
import History from './pages/History'
import Settings from './pages/Settings'
import Vagas from './pages/Vagas'
import Payroll from './pages/Payroll'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas */}
          <Route path="/" element={<Layout />}>
             <Route index element={<Dashboard />} />
             <Route path="employees" element={<Employees />} />
             <Route path="import-employees" element={<ImportEmployees />} />
             <Route path="units" element={<Units />} />
             
             {/* 👇 AQUI ESTAVA O ERRO! Agora só tem a nossa tela nova: */}
             <Route path="users" element={<Users />} /> 
             
             <Route path="payroll" element={<Payroll />} />
             <Route path="occurrences" element={<Occurrences />} />
             <Route path="history" element={<History />} />
             <Route path="settings" element={<Settings />} />
             <Route path="vagas" element={<Vagas />} />
             
             {/* Rotas de Ponto */}
             <Route path="registros" element={<MonthlyLogs />} />
             <Route path="logs" element={<MonthlyLogs />} />
             <Route path="records" element={<MonthlyLogs />} />
             <Route path="monthly-logs" element={<MonthlyLogs />} />
          </Route>
        </Routes>
        
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App