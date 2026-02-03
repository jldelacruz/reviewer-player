import { View, StyleSheet } from "react-native";
import { Text, IconButton, Button } from "react-native-paper";

const EmptyQnA = ({onPress}) => {
    return (
        <View style={styles.emptyContainer}>
            <IconButton
                icon="chat-question-outline"
                size={72}
                iconColor="#CBD5E1"
            />

            <Text variant="titleMedium">
                No Q&A's yet
            </Text>

            <Text style={styles.emptySub}>
                Add Q&A's to start studying.
            </Text>

            <Button
                mode="contained"
                icon="plus"
                onPress={onPress}
                style={{ marginTop: 16 }}
            >
                Add Q&A
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptySub: {
        opacity: 0.6,
        marginTop: 6,
        textAlign: "center",
    }
});

export default EmptyQnA;