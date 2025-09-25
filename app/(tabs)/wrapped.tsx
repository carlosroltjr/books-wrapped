import { useTheme } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Book, getBooks, normalizeSubject } from "../utils/books";

const CardIcons = {
  Glasses: "👓",
  Flame: "🔥",
  Book: "📖",
  PenTool: "✍️",
  Calendar: "📅",
};

type YearStats = {
  year: string;
  totalBooks: number;
  totalPages: number;
  topGenre: string | null;
  topAuthor: string | null;
  topBooks: Book[];
};

type CardData = {
  title: string;
  subtitle: string | React.ReactElement;
  icon: string;
};

export default function WrappedScreen() {
  const [stats, setStats] = useState<YearStats[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
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
              if (!norm) return;
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

  function getPagesMessage(totalPages: number): string | React.ReactElement {
    if (totalPages < 100) {
      return (
        <Text style={styles.subtitle}>
          you <Text style={styles.highlight}>read</Text>
          <Text style={styles.highlightLarge}> {totalPages}</Text> pages. Your
          books were lighter than a coffee break
        </Text>
      );
    } else if (totalPages < 500) {
      return (
        <Text style={styles.subtitle}>
          you <Text style={styles.highlight}>read</Text>
          <Text style={styles.highlightLarge}> {totalPages}</Text> pages, a
          light warm-up
        </Text>
      );
    } else if (totalPages < 2000) {
      return (
        <Text style={styles.subtitle}>
          you <Text style={styles.highlight}>made it through</Text>
          <Text style={styles.highlightLarge}> {totalPages}</Text> pages. Steady
          and solid
        </Text>
      );
    } else if (totalPages < 5000) {
      return (
        <Text style={styles.subtitle}>
          you <Text style={styles.highlight}>devoured</Text>
          <Text style={styles.highlightLarge}> {totalPages}</Text> pages. That’s
          some serious reading
        </Text>
      );
    } else {
      return (
        <Text style={styles.subtitle}>
          you <Text style={styles.highlight}>conquered</Text>
          <Text style={styles.highlightLarge}> {totalPages}</Text> pages.
          Legendary status unlocked
        </Text>
      );
    }
  }

  const getCardsData = (): CardData[] => {
    if (stats.length === 0) return [];
    const latestStats = stats[0];

    return [
      {
        title: `${latestStats.year} Wrapped Stories`,
        subtitle: `Your reading journey.`,
        icon: CardIcons.Calendar,
      },
      {
        title: "Your reading vibe this year?",
        subtitle: (
          <Text style={styles.subtitle}>
            Definitely{" "}
            <Text style={styles.highlight}>
              {latestStats.topGenre || "no genre defined"}
            </Text>
            .
          </Text>
        ),
        icon: CardIcons.Glasses,
      },
      {
        title: `In ${latestStats.year},`,
        subtitle: getPagesMessage(latestStats.totalPages),
        icon: CardIcons.Flame,
      },
      {
        title: "You read",
        subtitle: (
          <Text style={styles.subtitle}>
            <Text style={styles.highlight}>{latestStats.totalBooks}</Text> books
            this year, but things got serious with one author...
          </Text>
        ),
        icon: CardIcons.Book,
      },
      {
        title: "Your top author was",
        subtitle: (
          <Text style={styles.subtitle}>
            <Text style={styles.highlight}>{latestStats.topAuthor || "—"}</Text>
          </Text>
        ),
        icon: CardIcons.PenTool,
      },
      {
        title: "Top Books",
        subtitle: (
          <View style={styles.booksList}>
            {latestStats.topBooks.map((b) => (
              <View key={b.id} style={styles.bookItem}>
                <Text style={styles.bookTitle}>{b.title}</Text>
              </View>
            ))}
          </View>
        ),
        icon: CardIcons.Book,
      },
    ];
  };

  const cardsData = getCardsData();

  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX < -50 && currentCardIndex < cardsData.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else if (translationX > 50 && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
    }
  };

  if (stats.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={styles.loadingText}>Loading your stats...</Text>
      </SafeAreaView>
    );
  }

  const currentCard = cardsData[currentCardIndex];

  return (
    <PanGestureHandler onHandlerStateChange={onGestureEvent}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.card}>
          <Text style={styles.icon}>{currentCard.icon}</Text>
          <Text style={styles.title}>{currentCard.title}</Text>
          {typeof currentCard.subtitle === "string" ? (
            <Text style={styles.subtitle}>{currentCard.subtitle}</Text>
          ) : (
            currentCard.subtitle
          )}
        </View>
        <View style={styles.dotsContainer}>
          {cardsData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentCardIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "90%",
    aspectRatio: 9 / 16,
    backgroundColor: "#1f2937",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  highlight: {
    color: "#818cf8",
    fontWeight: "bold",
  },
  highlightLarge: {
    color: "#a855f7",
    fontWeight: "bold",
    fontSize: 40,
  },
  booksList: {
    alignItems: "center",
    justifyContent: "center",
  },
  bookItem: {
    alignItems: "center",
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 24,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#4b5563",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#6366f1",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
