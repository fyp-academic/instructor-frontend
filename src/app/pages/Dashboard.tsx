import React from 'react';
import { useAuth } from '../context/AuthContext';
import InstructorDashboard from './InstructorDashboard';
import AdminDashboard from './AdminDashboard';

// Role dispatcher: each role gets its own focused dashboard so neither UI
// carries the other's concerns.
export default function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <InstructorDashboard />;
}
