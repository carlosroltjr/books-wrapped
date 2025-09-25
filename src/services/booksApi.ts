import { Book, PartialBook } from "../types";
import { loadBooks, saveBooks } from "./booksStorage";

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

export async function addBook(
  workKey: string,
  partial?: PartialBook
): Promise<Book> {
  const books = await loadBooks();

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
