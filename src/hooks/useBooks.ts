import { loadBooks, saveBooks } from "../services/booksStorage";
import { Book } from "../types";

export async function setFinishedAt(id: string, finishedAt: Date | null) {
  const books = await loadBooks();
  let updated: Book[] = [];
  if (finishedAt) {
    const year = finishedAt.getFullYear();
    const month = finishedAt.getMonth() + 1;
    updated = books.map((b) =>
      b.id === id
        ? { ...b, finishedAt: `${year}-${String(month).padStart(2, "0")}` }
        : b
    );
  } else {
    updated = books.map((b) => (b.id === id ? { ...b, finishedAt: null } : b));
  }

  await saveBooks(updated);
}

export async function setRating(id: string, rating: number) {
  const books = await loadBooks();
  const updated = books.map((b) => (b.id === id ? { ...b, rating } : b));
  await saveBooks(updated);
}

export function normalizeSubject(subject: string): string | null {
  const lower = subject.toLowerCase();

  // Descartar lixo
  if (
    lower.startsWith("nyt:") ||
    lower.startsWith("award:") ||
    lower.includes("reviewed") ||
    lower.includes("bestseller") ||
    lower.includes("long now manual") ||
    lower.includes("open library staff") ||
    lower.includes("reading level") ||
    lower.includes("specimens") ||
    lower.includes("translations into") ||
    lower.includes("roman") ||
    lower.includes("anglais") ||
    /^[0-9/.ps]+$/.test(lower) // códigos
  ) {
    return null;
  }

  // Ficção
  if (lower.includes("cyberpunk")) return "Cyberpunk";
  if (lower.includes("hard science fiction")) return "Hard Science Fiction";
  if (
    lower.includes("science fiction") ||
    lower.includes("science-fiction") ||
    lower.includes("ciencia-ficción")
  ) {
    return "Science Fiction";
  }
  if (lower.includes("fantasy")) return "Fantasy";
  if (lower.includes("mystery") || lower.includes("detective"))
    return "Mystery & Detective";
  if (lower.includes("romance") || lower.includes("love stories"))
    return "Romance";
  if (
    lower.includes("horror") ||
    lower.includes("ghost") ||
    lower.includes("supernatural")
  )
    return "Horror";
  if (
    lower.includes("thriller") ||
    lower.includes("suspense") ||
    lower.includes("crime")
  )
    return "Thriller / Crime";
  if (lower.includes("historical fiction")) return "Historical Fiction";

  // Não-ficção
  if (
    lower.includes("biography") ||
    lower.includes("autobiography") ||
    lower.includes("memoir")
  )
    return "Biography / Memoir";
  if (lower.includes("history")) return "History";
  if (lower.includes("politics") || lower.includes("political science"))
    return "Politics";
  if (lower.includes("philosophy") || lower.includes("ethics"))
    return "Philosophy";
  if (
    lower.includes("religion") ||
    lower.includes("bible") ||
    lower.includes("theology") ||
    lower.includes("spirituality")
  )
    return "Religion / Spirituality";
  if (
    lower.includes("science") ||
    lower.includes("ecology") ||
    lower.includes("physics") ||
    lower.includes("biology") ||
    lower.includes("astronomy") ||
    lower.includes("mathematics")
  )
    return "Science";
  if (
    lower.includes("computer") ||
    lower.includes("cyberspace") ||
    lower.includes("technology") ||
    lower.includes("hackers")
  )
    return "Technology";
  if (
    lower.includes("business") ||
    lower.includes("economics") ||
    lower.includes("self-help")
  )
    return "Business & Self-Help";
  if (lower.includes("poetry")) return "Poetry";
  if (
    lower.includes("drama") ||
    lower.includes("theater") ||
    lower.includes("play")
  )
    return "Drama";

  // Se não cair em nenhum, retorna null (ignorar)
  return null;
}
