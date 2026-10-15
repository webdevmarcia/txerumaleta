export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function stripAccents(s = "") {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizeUsername(s = "") {
  return stripAccents(s)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 30);
}

export const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

export function timeAgo(date) {
  const d = new Date(date);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `há ${days} d`;
  return d.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function memberSince(date) {
  return new Date(date).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

export function location(profile) {
  if (!profile) return "";
  return [profile.city, profile.country].filter(Boolean).join(", ");
}

/** Converte o valor guardado numa rede social num link clicável. */
export function socialUrl(id, value) {
  if (!value) return null;
  const v = value.trim();
  if (id === "whatsapp") {
    const digits = v.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v.replace(/^\/+/, "")}`;
}

/** Reduz uma imagem antes de a enviar (poupa dados e espaço). */
export async function resizeImage(file, maxSize = 1600, quality = 0.85) {
  if (!file.type.startsWith("image/")) throw new Error("O ficheiro tem de ser uma imagem.");
  if (file.size > 15 * 1024 * 1024) throw new Error("A imagem é demasiado grande (máx. 15 MB).");

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
