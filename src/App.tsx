import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminSearchProvider } from "./components/admin/AdminSearchContext";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Login = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Cars = lazy(() => import("./pages/admin/Cars"));
const Bookings = lazy(() => import("./pages/admin/Bookings"));
const Clients = lazy(() => import("./pages/admin/Clients"));
const Contracts = lazy(() => import("./pages/admin/Contracts"));
const ContractDetail = lazy(() => import("./pages/admin/ContractDetail"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const PublicContractVerification = lazy(() => import("./pages/contracts/PublicContractVerification"));
const PublicContractSignature = lazy(() => import("./pages/contracts/PublicContractSignature"));

const supportedLanguages = ["fr", "en", "de"] as const;

type LanguageCode = (typeof supportedLanguages)[number];

const isSupportedLanguage = (value: string | undefined): value is LanguageCode =>
  Boolean(value && supportedLanguages.includes(value as LanguageCode));

const LanguageIndex = () => {
  const { lang } = useParams<{ lang: string }>();
  const { setLanguage } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSupportedLanguage(lang)) {
      setLanguage(lang);
      return;
    }

    navigate("/fr", { replace: true });
  }, [lang, setLanguage, navigate]);

  return <Index />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="atlas-cars-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner richColors position="top-right" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <I18nProvider>
            <AuthProvider>
              <Suspense fallback={<div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">Chargement...</div>}>
                <Routes>
                  <Route path="/" element={<Navigate to="/fr" replace />} />
                  <Route path="/:lang" element={<LanguageIndex />} />
                  <Route path="/signature/:id" element={<PublicContractSignature />} />
                  <Route path="/contracts/verify/:id" element={<PublicContractVerification />} />
                  <Route path="/contracts/:id" element={<PublicContractVerification />} />
                  <Route path="/admin/login" element={<Login />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminSearchProvider>
                          <AdminLayout />
                        </AdminSearchProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="cars" element={<Cars />} />
                    <Route path="bookings" element={<Bookings />} />
                    <Route path="contracts" element={<Contracts />} />
                    <Route path="contracts/:id" element={<ContractDetail />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="revenue" element={<Dashboard />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </I18nProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
