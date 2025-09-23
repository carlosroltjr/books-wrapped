import AsyncStorage from "@react-native-async-storage/async-storage";

export type Book = {
  id: string;
  title: string;
  author: string[];
  pages?: number;
  cover?: string;
  rating?: number | null;
  finishedAt?: string | null;
  genres?: string[];
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
  partial?: {
    title: string;
    author: string[];
    cover?: string;
    pages?: number;
  }
): Promise<Book> {
  const books = await getBooks();

  // Se já existe, retorna o existente
  const already = books.find((b) => b.id === workKey);
  if (already) return already;

  const res = await fetch(`https://openlibrary.org${workKey}/editions.json`);
  if (!res.ok) throw new Error("Failed to fetch editions from OpenLibrary");
  const data = await res.json();
  const editions = data.entries || [];

  // Função para extrair o ano (quanto mais confiável, melhor)
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

  const newBook: Book = {
    id: workKey,
    title: partial?.title ?? edition.title ?? "Untitled",
    author: partial?.author ?? [],
    pages: edition.number_of_pages ?? partial?.pages ?? null,
    cover: edition.covers?.length
      ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`
      : partial?.cover,
    rating: null,
    finishedAt: null,
    genres: edition.subjects || [],
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
export async function setFinishedAt(id: string, year: number, month: number) {
  const books = await getBooks();
  const updated = books.map((b) =>
    b.id === id
      ? { ...b, finishedAt: `${year}-${String(month).padStart(2, "0")}` }
      : b
  );
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

export async function getTotalPagesRead(): Promise<number> {
  const books = await getBooks();
  let pagesRead = 0;
  books.forEach((book) => {
    pagesRead += book.pages || 0;
  });
  return pagesRead;
}
