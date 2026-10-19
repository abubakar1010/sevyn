import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom'
import { AppLayout, type NavItem } from './AppLayout'
import { RequireRole } from './RequireRole'
import { DesignPage } from '@/features/design/DesignPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { OrganisationsPage } from '@/features/organisations/pages/OrganisationsPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { HomesPage } from '@/features/homes/pages/HomesPage'
import { YoungPeoplePage } from '@/features/young-people/pages/YoungPeoplePage'
import { StaffPage } from '@/features/staff/pages/StaffPage'
import { QuickLogsPage } from '@/features/quick-logs/pages/QuickLogsPage'
import { TasksPage } from '@/features/tasks/pages/TasksPage'
import { CompliancePage } from '@/features/compliance/pages/CompliancePage'
import { AuditsPoliciesPage } from '@/features/audits-policies/pages/AuditsPoliciesPage'
import { TrainingPage } from '@/features/training/pages/TrainingPage'
import { InterimMeasuresPage } from '@/features/interim-measures/pages/InterimMeasuresPage'
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage'
import { AuditLogPage } from '@/features/audit-log/pages/AuditLogPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Compliance' },
  { to: '/admin/organisations', label: 'Organisations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/homes', label: 'Homes' },
  { to: '/admin/staff', label: 'Staff' },
  { to: '/admin/training', label: 'Training' },
  { to: '/admin/interim-measures', label: 'Interim measures' },
  { to: '/admin/documents', label: 'Documents' },
  { to: '/admin/audit-log', label: 'Audit log' },
  { to: '/admin/settings', label: 'Settings' },
]

const managerNav: NavItem[] = [
  { to: '/manager', label: 'Compliance' },
  { to: '/manager/homes', label: 'Homes' },
  { to: '/manager/young-people', label: 'Young people' },
  { to: '/manager/quick-logs', label: 'Quick logs' },
  { to: '/manager/tasks', label: 'Tasks' },
  { to: '/manager/audits-policies', label: 'Audits & policies' },
  { to: '/manager/training', label: 'Training' },
  { to: '/manager/staff', label: 'Staff' },
  { to: '/manager/interim-measures', label: 'Interim measures' },
  { to: '/manager/documents', label: 'Documents' },
  { to: '/manager/audit-log', label: 'Audit log' },
]

const workerNav: NavItem[] = [
  { to: '/worker', label: 'Compliance' },
  { to: '/worker/young-people', label: 'Young people' },
  { to: '/worker/quick-logs', label: 'Quick logs' },
  { to: '/worker/tasks', label: 'Tasks' },
  { to: '/worker/documents', label: 'Documents' },
  { to: '/worker/interim-measures', label: 'Interim measures' },
  { to: '/worker/training', label: 'Training' },
]

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  ...(import.meta.env.DEV
    ? [{ path: '/design', element: <DesignPage /> }]
    : []),
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    path: '/admin',
    element: <RequireRole roles={['admin']} />,
    children: [
      {
        element: <AppLayout nav={adminNav} />,
        children: [
          { index: true, element: <CompliancePage /> },
          { path: 'organisations', element: <OrganisationsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'homes', element: <HomesPage /> },
          { path: 'staff', element: <StaffPage /> },
          { path: 'training', element: <TrainingPage /> },
          { path: 'interim-measures', element: <InterimMeasuresPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'audit-log', element: <AuditLogPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '/manager',
    element: <RequireRole roles={['registered_manager']} />,
    children: [
      {
        element: <AppLayout nav={managerNav} />,
        children: [
          { index: true, element: <CompliancePage /> },
          { path: 'homes', element: <HomesPage /> },
          { path: 'young-people', element: <YoungPeoplePage /> },
          { path: 'quick-logs', element: <QuickLogsPage /> },
          { path: 'tasks', element: <TasksPage /> },
          { path: 'audits-policies', element: <AuditsPoliciesPage /> },
          { path: 'training', element: <TrainingPage /> },
          { path: 'staff', element: <StaffPage /> },
          { path: 'interim-measures', element: <InterimMeasuresPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'audit-log', element: <AuditLogPage /> },
        ],
      },
    ],
  },
  {
    path: '/worker',
    element: <RequireRole roles={['support_worker']} />,
    children: [
      {
        element: <AppLayout nav={workerNav} />,
        children: [
          { index: true, element: <CompliancePage /> },
          { path: 'young-people', element: <YoungPeoplePage /> },
          { path: 'quick-logs', element: <QuickLogsPage /> },
          { path: 'tasks', element: <TasksPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'interim-measures', element: <InterimMeasuresPage /> },
          { path: 'training', element: <TrainingPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <p className="p-6">Page not found</p> },
]

export const router = createBrowserRouter(routes)
