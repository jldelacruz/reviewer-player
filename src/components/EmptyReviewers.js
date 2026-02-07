import { View, StyleSheet } from "react-native";
import { Text, IconButton, Button } from "react-native-paper";

const EmptyReviewers = ({onPress, isHomeScreen = false}) => {
    return (
        <View style={styles.emptyContainer}>
            <IconButton
                icon="book-open-blank-variant-outline"
                size={110}
                iconColor="#CBD5E1"
            />

            <Text variant="titleMedium">
                No reviewers yet
            </Text>

            <Text style={styles.emptySub}>
                Create your first reviewer to start studying.
            </Text>

            { onPress ? (
                <Button
                    mode="contained"
                    icon="plus"
                    onPress={onPress}
                    style={{ marginTop: 16 }}
                >
                    Create Reviewer
                </Button>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    emptySub: {
        opacity: 0.6,
        marginTop: 6,
        textAlign: "center",
    }
});

export default EmptyReviewers;