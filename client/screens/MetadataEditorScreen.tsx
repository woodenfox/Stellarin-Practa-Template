import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest, getApiUrl } from "@/lib/query-client";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  estimatedDuration?: number;
}

interface NameCheckResult {
  available: boolean;
  slug: string;
  reason?: string;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  error,
  onBlur,
  status,
  statusMessage,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  error?: string;
  onBlur?: () => void;
  status?: "idle" | "checking" | "available" | "taken" | "invalid";
  statusMessage?: string | null;
}) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    if (status === "available") return "#22C55E";
    if (status === "taken" || status === "invalid") return "#EF4444";
    return theme.textSecondary;
  };

  return (
    <View style={styles.fieldContainer}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            status && styles.inputWithStatus,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: error ? "#EF4444" : status === "available" ? "#22C55E" : status === "taken" || status === "invalid" ? "#EF4444" : theme.border,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          multiline={multiline}
          keyboardType={keyboardType}
          onBlur={onBlur}
        />
        {status === "checking" ? (
          <View style={styles.statusIcon}>
            <ActivityIndicator size="small" color={theme.textSecondary} />
          </View>
        ) : status === "available" ? (
          <View style={styles.statusIcon}>
            <Feather name="check-circle" size={18} color="#22C55E" />
          </View>
        ) : status === "taken" || status === "invalid" ? (
          <View style={styles.statusIcon}>
            <Feather name="x-circle" size={18} color="#EF4444" />
          </View>
        ) : null}
      </View>
      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : statusMessage && status !== "idle" ? (
        <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
          {statusMessage}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function MetadataEditorScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [version, setVersion] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [nameCheckStatus, setNameCheckStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [nameCheckMessage, setNameCheckMessage] = useState<string | null>(null);
  const [originalType, setOriginalType] = useState<string>("");
  
  const checkNameAvailability = useCallback(async (idValue: string) => {
    if (!idValue.trim() || idValue === originalType) {
      setNameCheckStatus("idle");
      setNameCheckMessage(null);
      return;
    }
    
    setNameCheckStatus("checking");
    setNameCheckMessage(null);
    
    try {
      const url = new URL("/api/practa/check-name", getApiUrl());
      url.searchParams.set("name", idValue);
      const response = await fetch(url.toString());
      const result: NameCheckResult = await response.json();
      
      if (result.available) {
        setNameCheckStatus("available");
        setNameCheckMessage("This ID is available");
      } else {
        setNameCheckStatus(result.reason?.includes("format") ? "invalid" : "taken");
        setNameCheckMessage(result.reason || "This ID is not available");
      }
    } catch {
      setNameCheckStatus("idle");
      setNameCheckMessage(null);
    }
  }, [originalType]);

  const { data: metadata, isLoading } = useQuery<PractaMetadata>({
    queryKey: ["/api/practa/metadata"],
  });

  useEffect(() => {
    if (metadata) {
      setType(metadata.type || "");
      setOriginalType(metadata.type || "");
      setName(metadata.name || "");
      setDescription(metadata.description || "");
      setAuthor(metadata.author || "");
      setVersion(metadata.version || "");
      setEstimatedDuration(
        metadata.estimatedDuration ? String(metadata.estimatedDuration) : ""
      );
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
      navigation.goBack();
    },
    onError: (error: Error & { errors?: string[] }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error.errors?.join("\n") || error.message || "Failed to save";
      Alert.alert("Save Failed", message);
    },
  });

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!type.trim()) {
      newErrors.type = "ID is required";
    } else if (!/^[a-z][a-z0-9-]*$/.test(type)) {
      newErrors.type = "Use lowercase letters and hyphens only";
    } else if (nameCheckStatus === "taken") {
      newErrors.type = "This ID is already taken";
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

  const handleSave = async () => {
    if (type.trim() !== originalType && nameCheckStatus === "checking") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Please Wait", "Checking ID availability...");
      return;
    }
    
    if (type.trim() !== originalType && nameCheckStatus !== "available" && nameCheckStatus !== "idle") {
      if (nameCheckStatus === "taken" || nameCheckStatus === "invalid") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Invalid ID", nameCheckMessage || "This ID is not available");
        return;
      }
    }
    
    if (type.trim() !== originalType && nameCheckStatus === "idle") {
      setNameCheckStatus("checking");
      try {
        const url = new URL("/api/practa/check-name", getApiUrl());
        url.searchParams.set("name", type.trim());
        const response = await fetch(url.toString());
        const result: NameCheckResult = await response.json();
        
        if (!result.available) {
          setNameCheckStatus(result.reason?.includes("format") ? "invalid" : "taken");
          setNameCheckMessage(result.reason || "This ID is not available");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Invalid ID", result.reason || "This ID is not available");
          return;
        }
        setNameCheckStatus("available");
        setNameCheckMessage("This ID is available");
      } catch {
        setNameCheckStatus("idle");
      }
    }
    
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

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
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
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.title}>Edit Practa Info</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <Card style={styles.card}>
          <FormField
            label="ID (unique identifier)"
            value={type}
            onChangeText={setType}
            placeholder="my-practa"
            error={errors.type}
            onBlur={() => checkNameAvailability(type)}
            status={nameCheckStatus}
            statusMessage={nameCheckMessage}
          />

          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="My Practa"
            error={errors.name}
          />

          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What does your Practa do?"
            multiline
            error={errors.description}
          />

          <FormField
            label="Author"
            value={author}
            onChangeText={setAuthor}
            placeholder="Your Name"
            error={errors.author}
          />

          <FormField
            label="Version"
            value={version}
            onChangeText={setVersion}
            placeholder="1.0.0"
            error={errors.version}
          />

          <FormField
            label="Estimated Duration (seconds)"
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
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
          disabled={saveMutation.isPending}
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            saveMutation.isPending && styles.buttonDisabled,
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
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
  inputWrapper: {
    position: "relative",
  },
  inputWithStatus: {
    paddingRight: 40,
  },
  statusIcon: {
    position: "absolute",
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  statusText: {
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
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
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
