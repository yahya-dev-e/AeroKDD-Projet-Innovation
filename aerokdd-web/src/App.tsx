import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout'
import { AdminPage } from './pages/AdminPage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { ManagerPage } from './pages/ManagerPage'
import { NetworkPage } from './pages/NetworkPage'
import { OverviewPage } from './pages/OverviewPage'
import { RepositoriesPage } from './pages/RepositoriesPage'
import { SubsystemPage } from './pages/SubsystemPage'
import { TopDownPage } from './pages/TopDownPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/subsystems/:code" element={<SubsystemPage />} />
          <Route path="/explore" element={<ExplorerPage />} />
          <Route path="/explore/:kddId" element={<ExplorerPage />} />
          <Route path="/explorer" element={<Navigate to="/explore" replace />} />
          <Route path="/top-down" element={<TopDownPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
