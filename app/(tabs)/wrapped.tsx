import { ScrollView, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { useTheme } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Book, getBooks, normalizeSubject } from "../utils/books";

type YearStats = {
  year: string;
  totalBooks: number;
  totalPages: number;
  topGenre: string | null;
  topAuthor: string | null;
  topBooks: Book[];
};

export default function WrappedScreen() {
  const [stats, setStats] = useState<YearStats[]>([]);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    const books = await getBooks();
    if (!books) return;

    const readBooks = books.filter((book) => book.finishedAt);

    const grouped: Record<string, Book[]> = {};
    readBooks.forEach((book) => {
      const year = book.finishedAt!.split("-")[0];
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(book);
    });

    const yearStats: YearStats[] = Object.entries(grouped).map(
      ([year, books]) => {
        const totalBooks = books.length;
        const totalPages = books.reduce((sum, b) => sum + (b.pages || 0), 0);

        const authorCount: Record<string, number> = {};
        books.forEach((book) => {
          book.author.forEach((author: string | number) => {
            authorCount[author] = (authorCount[author] || 0) + 1;
          });
        });
        const topAuthor =
          Object.entries(authorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          null;

        const genreCount: Record<string, number> = {};
        books.forEach((b) => {
          if (b.subjects)
            b.subjects.forEach((s) => {
              const norm = normalizeSubject(s);
              if (!norm) return; // ignora subjects ruins
              genreCount[norm] = (genreCount[norm] || 0) + 1;
            });
        });

        const topGenre =
          Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          null;

        const topBooks = [...books]
          .sort((a, b) => (b.rating && a.rating ? b.rating - a.rating : 0))
          .slice(0, 5);

        return {
          year,
          totalBooks,
          totalPages,
          topAuthor,
          topGenre,
          topBooks,
        };
      }
    );

    setStats(yearStats.sort((a, b) => Number(b.year) - Number(a.year)));
  }

  function getPagesMessage(year: string, totalPages: number): string {
    if (totalPages === 0) {
      return `In ${year}, you didn’t turn a single page. Maybe next year will be your comeback story`;
    } else if (totalPages < 500) {
      return `In ${year}, you read ${totalPages} pages — a light warm-up`;
    } else if (totalPages < 2000) {
      return `In ${year}, you made it through ${totalPages} pages. Steady and solid`;
    } else if (totalPages < 5000) {
      return `In ${year}, you devoured ${totalPages} pages. That’s some serious reading`;
    } else {
      return `In ${year}, you conquered ${totalPages} pages. Legendary status unlocked`;
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Wrapped</Text>
      {stats.map((s) => (
        <View
          key={s.year}
          style={[
            styles.yearBlock,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={styles.year}>{s.year}</Text>
          <Text>Your reading vibe this year? Definitely {s.topGenre}.</Text>
          <Text>{getPagesMessage(s.year, s.totalPages)}</Text>
          <Text>
            You read {s.totalBooks} books this year, but things got serious with
            one author...
          </Text>
          <Text>Your top author was {s.topAuthor || "—"}</Text>
          <Text style={{ marginTop: 10, fontWeight: "bold" }}>Top Books</Text>
          {s.topBooks.map((b) => (
            <Text key={b.id}>
              - {b.title} ({b.rating}/5)
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  yearBlock: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  year: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
