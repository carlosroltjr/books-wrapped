import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WrappedCardProps } from "../src/types";

export function WrappedCard({ icon, title, subtitle, color }: WrappedCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color }]}>{title}</Text>

      {typeof subtitle === "string" ? (
        <Text style={[styles.subtitle, { color }]}>{subtitle}</Text>
      ) : (
        subtitle
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    aspectRatio: 9 / 16,
    borderRadius: 24,
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
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
});
