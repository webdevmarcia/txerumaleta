import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { PostCard } from "../components/posts";
import { EmptyState, PageLoader } from "../components/ui";
import { usePostFeed } from "../hooks/usePostFeed";

const NO_PARAMS = {};

export default function Saved() {
  const feed = usePostFeed(NO_PARAMS, { saved: true });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Guardados</h1>
        <p className="text-sm text-slate-600">Dicas e oportunidades que guardaste para ver mais tarde. Só tu vês esta lista.</p>
      </div>
      {feed.loading ? (
        <PageLoader />
      ) : feed.posts.length === 0 ? (
        <EmptyState icon={Bookmark} title="Ainda não guardaste nada" action={<Link to="/" className="btn btn-primary">Explorar o feed</Link>}>
          Carrega em “Guardar” numa publicação para a encontrares aqui.
        </EmptyState>
      ) : (
        feed.posts.map((p) => <PostCard key={p.id} post={p} onDeleted={feed.remove} />)
      )}
    </div>
  );
}
