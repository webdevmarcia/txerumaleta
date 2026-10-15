/** Limpa o formulário antes de guardar. */
export function cleanProfile(p) {
  const socials = Object.fromEntries(Object.entries(p.socials ?? {}).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
  return {
    ...p,
    full_name: (p.full_name ?? "").trim(),
    headline: (p.headline ?? "").trim(),
    bio: (p.bio ?? "").trim(),
    city: (p.city ?? "").trim(),
    socials,
    experience: (p.experience ?? []).filter((e) => e.title.trim() || e.org.trim()),
  };
}
