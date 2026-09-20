import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ProcessEmail from './pages/ProcessEmail';
import HumanReview from './pages/HumanReview';
import KnowledgeBase from './pages/KnowledgeBase';
import BugTracker from './pages/BugTracker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/"               element={<Dashboard />} />
              <Route path="/process-email"  element={<ProcessEmail />} />
              <Route path="/human-review"   element={<HumanReview />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/bug-tracker"    element={<BugTracker />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #e8eaed',
              boxShadow: '0 4px 16px rgba(60,64,67,0.15)',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
