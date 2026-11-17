import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { muiTheme } from './theme'
import MainLayout from './layouts/MainLayout'
import SegmentPage from './pages/SegmentPage'
import CoordinatorAtPage from './pages/CoordinatorAtPage'
import CoordinatorPage from './pages/CoordinatorPage'
import SupervisorPage from './pages/SupervisorPage'
import FrequenciaPage from './pages/FrequenciaPage'
import PausasPage from './pages/PausasPage'
import AdminPage from './pages/AdminPage'
import ErrorNotFound from './pages/ErrorNotFound'
import './css/tailwind.css'
import './css/app.scss'

export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/segmento" replace />} />
            <Route path="segmento" element={<SegmentPage />} />
            <Route path="coordenador-at" element={<CoordinatorAtPage />} />
            <Route path="coordenador" element={<CoordinatorPage />} />
            <Route path="supervisor" element={<SupervisorPage />} />
            <Route path="frequencia" element={<FrequenciaPage />} />
            <Route path="pausas" element={<PausasPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<ErrorNotFound />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}
