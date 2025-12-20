import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";

import { Spacing } from "@/constants/theme";

const footerImage = require("@/assets/images/footer-illustration.png");

export function FooterIllustration() {
  const { width } = useWindowDimensions();
  const imageHeight = width * 0.6;

  return (
    <Image
      source={footerImage}
      style={[
        styles.image,
        {
          width: width,
          height: imageHeight,
          marginBottom: -Spacing.xl,
        },
      ]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    marginTop: Spacing["3xl"],
    marginHorizontal: -Spacing.lg,
  },
});
