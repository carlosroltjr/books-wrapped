import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Book,
  deleteBook,
  getBooks,
  setFinishedAt,
  setRating,
} from "../utils/books";

export default function MyBooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const { colors } = useTheme();

  async function load() {
    setBooks(await getBooks());
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function handleDelete(id: string) {
    await deleteBook(id);
    load();
  }

  async function handleRating(id: string, rating: number) {
    await setRating(id, rating);
    load();
  }

  const handleFinished = async (id: string, finishedDate: Date | null) => {
    await setFinishedAt(id, finishedDate);
    load();
  };

  const renderStars = (book: Book) => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <View style={{ flexDirection: "row" }}>
        {stars.map((s) => (
          <TouchableOpacity key={s} onPress={() => handleRating(book.id, s)}>
            <MaterialCommunityIcons
              name={s <= (book.rating || 0) ? "star" : "star-outline"}
              size={24}
              color="gold"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.flatList,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {item.cover && (
              <Image
                source={{ uri: item.cover }}
                style={{ width: 60, height: 90, marginRight: 12 }}
              />
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.titleText, { color: colors.text }]}>
                  {item.title}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <MaterialCommunityIcons
                    name="trash-can"
                    size={24}
                    color={colors.notification}
                  />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.text }}>
                {item.author.join(", ")}
              </Text>
              {item.finishedAt && (
                <Text style={{ color: "green" }}>
                  Finished at: {item.finishedAt}
                </Text>
              )}
              {renderStars(item)}
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ marginRight: 10, color: colors.text }}>
                    Finished?
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, { marginHorizontal: 0 }]}
                      onPress={() => {
                        setActiveBookId(item.id);
                        setShowPicker(true);
                      }}
                    >
                      <Text style={styles.buttonText}>Yep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => {
                        handleFinished(item.id, null);
                      }}
                    >
                      <Text style={styles.buttonText}>Not yet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      />
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={date}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, selectedDate) => {
            setShowPicker(Platform.OS === "ios");
            if (selectedDate && activeBookId) {
              handleFinished(activeBookId, selectedDate);
              setActiveBookId(null);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flatList: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    fontWeight: "bold",
    fontSize: 16,
    flexShrink: 1,
  },
  buttonRow: {
    flexDirection: "row",
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
