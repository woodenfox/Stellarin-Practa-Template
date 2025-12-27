import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  estimatedDuration?: number;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  error?: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.fieldContainer}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            backgroundColor: theme.backgroundSecondary,
            color: theme.text,
            borderColor: error ? "#EF4444" : theme.border,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
      />
      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

export default function EditPractaScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [version, setVersion] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: metadata, isLoading } = useQuery<PractaMetadata>({
    queryKey: ["/api/practa/metadata"],
  });

  useEffect(() => {
    if (metadata) {
      setType(metadata.type || "");
      setName(metadata.name || "");
      setDescription(metadata.description || "");
      setAuthor(metadata.author || "");
      setVersion(metadata.version || "");
      setEstimatedDuration(
        metadata.estimatedDuration ? String(metadata.estimatedDuration) : ""
      );
      setHasUnsavedChanges(false);
    }
  }, [metadata]);

  const saveMutation = useMutation({
    mutationFn: async (data: PractaMetadata) => {
      const res = await apiRequest("PUT", "/api/practa/metadata", data);
      return res.json() as Promise<PractaMetadata>;
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(["/api/practa/metadata"], savedData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasUnsavedChanges(false);
    },
    onError: (error: Error & { errors?: string[] }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error.errors?.join("\n") || error.message || "Failed to save";
      Alert.alert("Save Failed", message);
    },
  });

  const handleFieldChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!type.trim()) {
      newErrors.type = "Type is required";
    } else if (!/^[a-z][a-z0-9-]*$/.test(type)) {
      newErrors.type = "Use lowercase letters and hyphens only";
    }

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!author.trim()) {
      newErrors.author = "Author is required";
    }

    if (!version.trim()) {
      newErrors.version = "Version is required";
    } else if (!/^\d+\.\d+\.\d+/.test(version)) {
      newErrors.version = "Use format: 1.0.0";
    }

    if (estimatedDuration && isNaN(Number(estimatedDuration))) {
      newErrors.estimatedDuration = "Must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateFields()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const data: PractaMetadata = {
      type: type.trim(),
      name: name.trim(),
      description: description.trim(),
      author: author.trim(),
      version: version.trim(),
      estimatedDuration: estimatedDuration
        ? Number(estimatedDuration)
        : undefined,
    };

    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Edit Practa</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Update your Practa metadata
          </ThemedText>
        </View>

        <Card style={styles.card}>
          <FormField
            label="ID (unique identifier)"
            value={type}
            onChangeText={handleFieldChange(setType)}
            placeholder="my-practa"
            error={errors.type}
          />

          <FormField
            label="Name"
            value={name}
            onChangeText={handleFieldChange(setName)}
            placeholder="My Practa"
            error={errors.name}
          />

          <FormField
            label="Description"
            value={description}
            onChangeText={handleFieldChange(setDescription)}
            placeholder="What does your Practa do?"
            multiline
            error={errors.description}
          />

          <FormField
            label="Author"
            value={author}
            onChangeText={handleFieldChange(setAuthor)}
            placeholder="Your Name"
            error={errors.author}
          />

          <FormField
            label="Version"
            value={version}
            onChangeText={handleFieldChange(setVersion)}
            placeholder="1.0.0"
            error={errors.version}
          />

          <FormField
            label="Estimated Duration (seconds)"
            value={estimatedDuration}
            onChangeText={handleFieldChange(setEstimatedDuration)}
            placeholder="15"
            keyboardType="numeric"
            error={errors.estimatedDuration}
          />
        </Card>

        <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
          Changes are saved to practa.config.json. Update the metadata export
          in your component to match.
        </ThemedText>

        <Pressable
          onPress={handleSave}
          disabled={saveMutation.isPending || !hasUnsavedChanges}
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            (saveMutation.isPending || !hasUnsavedChanges) && styles.buttonDisabled,
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="save" size={18} color="white" />
              <ThemedText style={styles.saveButtonText}>
                {hasUnsavedChanges ? "Save Changes" : "Saved"}
              </ThemedText>
            </>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
