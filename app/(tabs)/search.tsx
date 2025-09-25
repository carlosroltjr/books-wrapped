import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addBook, Book, Partial, searchBooks } from "../utils/books";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const books = await searchBooks(query);
      setResults(books);
    } catch (e) {
      Alert.alert("Error", "Failed to fetch books");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(
    workKey: string,
    partial?: Partial
  ) {
    try {
      const newBook = await addBook(workKey, partial);
      Alert.alert("Success", `${newBook.title} was saved to My Books!`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save the book.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        placeholder="Search books..."
        placeholderTextColor={colors.text + "99"}
        value={query}
        onChangeText={setQuery}
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text },
        ]}
      />
      <View style={{marginBottom: 15}}>
        <Button title="Search" onPress={handleSearch} color={colors.primary} />
      </View>
      {loading && <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {item.cover && (
              <Image source={{ uri: item.cover }} style={styles.cover} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              {item.author?.length > 0 && (
                <Text style={[styles.author, { color: colors.text }]}>{item.author.join(", ")}</Text>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  handleAdd(item.id, {
                    title: item.title,
                    author: item.author,
                    subjects: item.subjects,
                    cover: item.cover,
                    pages: item.pages,
                  })
                }
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
  },
  cover: { width: 50, height: 70, marginRight: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  author: { fontSize: 14, color: "#666" },
  button: {
    marginTop: 5,
    backgroundColor: "#e0e0e0",
    padding: 6,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
