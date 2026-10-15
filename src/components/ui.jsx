// Pequenos componentes de interface usados em toda a app.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, X } from "lucide-react";
import { cn, initials } from "../lib/utils";
import { POST_CATEGORIES } from "../lib/constants";

// ---------------------------------------------------------------------
export function Logo({ className = "", compact = false }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden="true">
        <path d="M24 14v-3a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3" fill="none" stroke="#003893" strokeWidth="4" strokeLinecap="round" />
        <rect x="6" y="14" width="52" height="42" rx="10" fill="#003893" />
        <rect x="6" y="36" width="52" height="3" fill="#fff" />
        <rect x="6" y="39" width="52" height="3" fill="#CF2027" />
        <rect x="6" y="42" width="52" height="3" fill="#fff" />
        <path d="M32 19.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7z" fill="#F7D116" />
      </svg>
      {!compact && (
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">
          txeru<span className="text-brand-700">maleta</span>
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------
const AVATAR_COLORS = ["bg-brand-700", "bg-coral-500", "bg-emerald-600", "bg-violet-600", "bg-amber-500", "bg-sky-600"];
const AVATAR_SIZES = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-28 text-3xl",
};

export function Avatar({ profile, size = "md", className = "", ring = false }) {
  const name = profile?.full_name || profile?.username || "";
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const base = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
    AVATAR_SIZES[size],
    ring && "ring-4 ring-white",
    className
  );
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt={name} className={cn(base, "object-cover")} loading="lazy" />;
  }
  return (
    <span className={cn(base, color)} aria-label={name}>
      {initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------------
export function Spinner({ className = "" }) {
  return <LoaderCircle className={cn("size-5 animate-spin text-brand-700", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-7" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="text-base font-bold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
export function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "animate-pop-in flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost -mr-2 p-2" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        <div className="scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function Dropdown({ trigger, children, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn(
            "animate-pop-in absolute z-50 mt-2 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
export function CategoryBadge({ category, className = "" }) {
  const c = POST_CATEGORIES.find((x) => x.id === category);
  if (!c) return null;
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", c.className, className)}>{c.label}</span>;
}

// ---------------------------------------------------------------------
/** Seleção de opções em forma de "chips". */
export function ChipSelect({ options, value, onChange, multiple = true }) {
  const selected = multiple ? value ?? [] : [value];
  const toggle = (id) => {
    if (!multiple) return onChange(value === id ? "" : id);
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button type="button" key={id} className="chip-toggle" data-active={selected.includes(id)} onClick={() => toggle(id)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
/** Campo para escrever etiquetas (ex.: competências). Enter ou vírgula adiciona. */
export function TagInput({ value = [], onChange, placeholder, max = 15, suggestions = [] }) {
  const [text, setText] = useState("");
  const add = (raw) => {
    const t = raw.trim().replace(/,$/, "");
    if (!t || value.some((v) => v.toLowerCase() === t.toLowerCase()) || value.length >= max) return;
    onChange([...value, t.slice(0, 40)]);
  };
  const free = suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  return (
    <div>
      <div className="input flex min-h-11 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
        {value.map((tag) => (
          <span key={tag} className="chip bg-brand-50 text-brand-700">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remover ${tag}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          className="min-w-32 flex-1 border-0 bg-transparent p-1 text-sm outline-none"
          value={text}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
              setText("");
            } else if (e.key === "Backspace" && !text && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            add(text);
            setText("");
          }}
        />
      </div>
      {free.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {free.map((s) => (
            <button type="button" key={s} onClick={() => add(s)} className="chip hover:bg-brand-50 hover:text-brand-700">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
/** Transforma links no texto em links clicáveis. */
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
export function Linkify({ text }) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part.startsWith("http") ? part : `https://${part}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-medium text-brand-700 underline-offset-2 hover:underline break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

// ---------------------------------------------------------------------
export function ProfileLink({ profile, className = "", children }) {
  if (!profile) return <span className={className}>{children}</span>;
  return (
    <Link to={`/u/${profile.username}`} className={className}>
      {children}
    </Link>
  );
}
