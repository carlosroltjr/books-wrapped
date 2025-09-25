import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { getTotalPagesMessage } from "../constants/messages";
import { TotalPagesCardProps } from "../src/types";

export function TotalPagesCard({ totalPages } : TotalPagesCardProps) {
  const { colors } = useTheme();
  const message = getTotalPagesMessage(totalPages);
  return (
    <Text style={[styles.subtitle, { color: colors.text }]}>
      {message.title} <Text style={styles.highlight}>{message.highlight}</Text>
      <Text style={styles.highlightLarge}> {totalPages}</Text> {message.subtitle}
    </Text>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
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
});
