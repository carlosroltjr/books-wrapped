import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book } from "../types";

const STORAGE_KEY = "@books_wrapped";

export async function loadBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveBooks(books: Book[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export async function deleteBook(id: string): Promise<void> {
  const books = await loadBooks();
  const filtered = books.filter((b) => b.id !== id);
  await saveBooks(filtered);
}
