import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";

import { Spacing } from "@/constants/theme";

const footerImage = require("@/assets/images/footer-illustration.png");

export function FooterIllustration() {
  const { width } = useWindowDimensions();
  const imageHeight = width * 0.6;

  return (
    <View style={styles.container}>
      <Image
        source={footerImage}
        style={[styles.image, { width: width, height: imageHeight }]}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing["3xl"],
    marginHorizontal: -Spacing.lg,
  },
  image: {},
});
