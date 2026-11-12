import { isbnFromBarcode } from "@grimo/core";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Full-screen camera that reads a book's barcode and hands back its ISBN-13. */
export function IsbnScanner({
  visible,
  onScanned,
  onClose,
}: {
  visible: boolean;
  onScanned: (isbn: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  // The camera reports the same code many times a second: take the first valid one.
  const done = useRef(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onShow={() => {
        done.current = false;
      }}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        {permission?.granted ? (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
              onBarcodeScanned={({ data }) => {
                const isbn = isbnFromBarcode(data);
                if (!isbn || done.current) return;
                done.current = true;
                onScanned(isbn);
              }}
            />
            <View style={[styles.frame, { borderColor: theme.accent }]} />
          </View>
        ) : (
          <View style={styles.ask}>
            <Text>Para ler o código de barras do livro, o Grimo precisa usar a câmera.</Text>
            {permission && !permission.canAskAgain ? (
              <Text color="textMuted">
                O acesso à câmera foi negado. Libere nos ajustes do aparelho.
              </Text>
            ) : (
              <Button title="Permitir câmera" onPress={requestPermission} />
            )}
          </View>
        )}
        <View style={styles.footer}>
          <Text color="textMuted">Aponte para o código de barras do verso do livro.</Text>
          <Button variant="ghost" title="Cancelar" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cameraBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: { width: "80%", height: 140, borderWidth: 2, borderRadius: radius.md },
  ask: { flex: 1, justifyContent: "center", gap: spacing[4], padding: spacing[6] },
  footer: { gap: spacing[2], padding: spacing[4], alignItems: "center" },
});
