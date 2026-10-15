import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout, GuestOnly, RequireAuth } from "./components/layout";
import { EmptyState, PageLoader } from "./components/ui";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ForgotPassword, Login, NewPassword, Register } from "./pages/Auth";
import Community from "./pages/Community";
import Explore from "./pages/Explore";
import Feed from "./pages/Feed";
import Landing from "./pages/Landing";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import PostPage from "./pages/PostPage";
import Profile from "./pages/Profile";
import Saved from "./pages/Saved";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import { Compass } from "lucide-react";

/** Na raiz "/" mostra a página de apresentação a visitantes e o feed a membros. */
function MemberGate() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <PageLoader />;
  if (!user && pathname === "/") return <Landing />;
  return <RequireAuth />;
}

function NotFound() {
  return (
    <EmptyState icon={Compass} title="Página não encontrada" action={<Link to="/" className="btn btn-primary">Voltar ao início</Link>}>
      O link pode estar errado ou a página foi removida.
    </EmptyState>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/entrar" element={<Login />} />
              <Route path="/registar" element={<Register />} />
              <Route path="/recuperar" element={<ForgotPassword />} />
            </Route>
            <Route path="/nova-password" element={<NewPassword />} />
            <Route path="/comunidade" element={<Community />} />

            <Route element={<RequireAuth allowIncomplete />}>
              <Route path="/bem-vindo" element={<Onboarding />} />
            </Route>

            <Route element={<MemberGate />}>
              <Route element={<AppLayout />}>
                <Route index element={<Feed />} />
                <Route path="/explorar" element={<Explore />} />
                <Route path="/servicos" element={<Services />} />
                <Route path="/mensagens/:conversationId?" element={<Messages />} />
                <Route path="/notificacoes" element={<Notifications />} />
                <Route path="/guardados" element={<Saved />} />
                <Route path="/definicoes" element={<Settings />} />
                <Route path="/u/:username" element={<Profile />} />
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
