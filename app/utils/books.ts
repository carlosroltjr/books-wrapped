import AsyncStorage from "@react-native-async-storage/async-storage";

export type Book = {
  id: string;
  title: string;
  author: string[];
  pages?: number;
  cover?: string;
  rating?: number | null;
  finishedAt?: string | null;
  subjects?: string[];
};

export type Partial = {
  title: string;
  author: string[];
  subjects?: string[];
  cover?: string;
  pages?: number;
};

export default function booksUtils() {}

const STORAGE_KEY = "@books_wrapped";

/**
 * Busca livros na OpenLibrary
 */
export async function searchBooks(query: string): Promise<Book[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Failed to fetch from OpenLibrary");
  const data = await res.json();

  return (data.docs || []).slice(0, 15).map((doc: any) => ({
    id: doc.key,
    title: doc.title,
    author: doc.author_name || [],
    pages: doc.number_of_pages_median || undefined,
    cover: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
  }));
}

/**
 * Adiciona um livro com edição válida (páginas, capa e idioma)
 * Retorna o livro salvo. Se já existir, retorna o existente.
 */
export async function addBook(
  workKey: string,
  partial?: Partial
): Promise<Book> {
  const books = await getBooks();

  // Se já existe, retorna o existente
  const already = books.find((b) => b.id === workKey);
  if (already) return already;

  const res = await fetch(`https://openlibrary.org${workKey}/editions.json`);
  if (!res.ok) throw new Error("Failed to fetch editions from OpenLibrary");
  const data = await res.json();
  const editions = data.entries || [];

  // Função para extrair o ano
  const getYear = (ed: any): number => {
    if (ed.publish_date) {
      const match = ed.publish_date.match(/\d{4}/);
      return match ? parseInt(match[0], 10) : 0;
    }
    if (ed.created?.value) {
      return new Date(ed.created.value).getFullYear();
    }
    return 0;
  };

  // Ordena: 1) idioma (português > inglês > outros), 2) ano decrescente
  const sorted = editions
    .filter(
      (entry: any) =>
        entry.number_of_pages &&
        entry.covers &&
        entry.languages &&
        entry.languages.some(
          (lang: any) =>
            lang.key === "/languages/eng" || lang.key === "/languages/por"
        )
    )
    .sort((a: any, b: any) => {
      const langScore = (ed: any) =>
        ed.languages.some((l: any) => l.key === "/languages/por")
          ? 2
          : ed.languages.some((l: any) => l.key === "/languages/eng")
          ? 1
          : 0;

      const langDiff = langScore(b) - langScore(a);
      if (langDiff !== 0) return langDiff;

      return getYear(b) - getYear(a); // mais recente primeiro
    });

  const edition = sorted[0];
  if (!edition) throw new Error("No valid edition found");

  // Tenta pegar genres da edição
  let subjects: string[] = edition.subjects || [];

  // Se não tem, busca no work
  if (!subjects.length) {
    const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
    if (workRes.ok) {
      const workData = await workRes.json();
      subjects = workData.subjects || [];
    }
  }

  const newBook: Book = {
    id: workKey,
    title: partial?.title ?? edition.title ?? "Untitled",
    author: partial?.author ?? edition.author ?? [],
    pages: partial?.pages ?? edition.number_of_pages ?? null,
    cover: edition.covers?.length
      ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`
      : partial?.cover,
    rating: null,
    finishedAt: null,
    subjects: partial?.subjects ?? subjects,
  };

  await saveBooks([...books, newBook]);
  return newBook;
}

/**
 * Retorna os livros salvos
 */
export async function getBooks(): Promise<Book[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Book[];
    return parsed;
  } catch (e) {
    console.error("getBooks error:", e);
    return [];
  }
}

/**
 * Salva a lista inteira de livros
 */
export async function saveBooks(books: Book[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/**
 * Exclui um livro
 */
export async function deleteBook(id: string): Promise<void> {
  const books = await getBooks();
  const filtered = books.filter((b) => b.id !== id);
  await saveBooks(filtered);
}

/**
 * Define data de conclusão do livro
 */
export async function setFinishedAt(id: string, finishedAt: Date | null) {
  const books = await getBooks();
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

/**
 * Define nota de 1 a 5 estrelas do livro
 */
export async function setRating(id: string, rating: number) {
  const books = await getBooks();
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
