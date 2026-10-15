import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileX } from "lucide-react";
import { api } from "../api";
import { PostCard } from "../components/posts";
import { EmptyState, PageLoader } from "../components/ui";
import { useApi } from "../hooks/useApi";

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: post, loading } = useApi(() => api.posts.get(id), [id]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="btn btn-ghost -ml-3">
        <ArrowLeft className="size-4" /> Voltar
      </button>
      {loading ? (
        <PageLoader />
      ) : !post ? (
        <EmptyState icon={FileX} title="Publicação não encontrada" action={<Link to="/" className="btn btn-primary">Ir para o início</Link>}>
          Pode ter sido eliminada pelo autor.
        </EmptyState>
      ) : (
        <PostCard post={post} defaultShowComments onDeleted={() => navigate("/")} />
      )}
    </div>
  );
}
