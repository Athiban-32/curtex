import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuditLogEntry } from '../../types'; 
import { listenToAuditLogs, deleteDocument } from '../../utils/firebaseUtils'; // Import new delete function
import { format } from 'date-fns';

// Helper function to get color based on log type
const getLogColor = (type: AuditLogEntry['type']) => {
  switch (type) {
    case 'ADD':
      return '#4CAF50'; // Green
    case 'UPDATE':
      return '#FF9800'; // Orange
    case 'DELETE':
      return '#F44336'; // Red
    case 'STATUS_CHANGE':
      return '#007AFF'; // Blue
    default:
      return '#888'; // Gray
  }
};

const AuditLogScreen = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToAuditLogs((data) => {
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  // --- THIS IS THE UPDATED UNDO LOGIC ---
  const handleUndo = (log: AuditLogEntry) => {
    if (log.type === 'ADD') {
      // This is an "ADD" log, so "Undo" means "Delete"
      Alert.alert(
        'Undo "ADD" Action',
        `This will permanently delete the item: ${log.docRef}.\n\nAre you sure you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'OK, Delete It', 
            style: 'destructive', 
            // --- THIS IS THE FIX ---
            // Pass the user-friendly 'log.docRef' to the delete function
            onPress: () => deleteDocument(log.collectionName, log.docId, log.docRef) 
          },
        ]
      );
    } else {
      // For UPDATE, STATUS_CHANGE, etc.
      Alert.alert(
        'Undo Action',
        'This type of action (like "UPDATE") cannot be undone at this time.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderLogItem = ({ item }: { item: AuditLogEntry }) => {
    const color = getLogColor(item.type);
    return (
      <View style={styles.logCardWrapper}>
        <View style={[styles.logCardLine, { backgroundColor: color }]} />
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <View style={[styles.logTypeBadge, { backgroundColor: color }]}>
              <Text style={styles.logTypeBadgeText}>
                {item.type ? item.type.replace('_', ' ') : 'UNKNOWN'}
              </Text>
            </View>
            <Text style={styles.logTimestamp}>
              {item.timestamp ? format(item.timestamp, 'h:mm a dd/MM/yyyy') : 'No date'}
            </Text>
          </View>
          <Text style={styles.logText}>
            <Text style={styles.logLabel}>User:</Text> {item.userEmail || 'N/A'}
          </Text>
          <Text style={styles.logText}>
            <Text style={styles.logLabel}>Item:</Text> {item.docRef || 'N/A'}
          </Text>
          {item.changeDetails && (
            <Text style={styles.logText}>
              <Text style={styles.logLabel}>Change:</Text> {item.changeDetails}
            </Text>
          )}
          {item.canUndo && (
            <TouchableOpacity style={styles.undoButton} onPress={() => handleUndo(item)}>
              <Ionicons name="arrow-undo-outline" size={18} color="#E57373" />
              <Text style={styles.undoButtonText}>Undo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Audit Log & History',
          headerTitleStyle: { color: '#333' },
          headerStyle: { backgroundColor: '#fff' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id!}
          style={styles.container}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No audit logs found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// --- STYLES (No changes) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  logCardWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  logCardLine: {
    width: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  logCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2, 
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }
    }),
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  logText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  logLabel: {
    fontWeight: 'bold',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEB', 
    borderRadius: 20, 
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start', 
    marginTop: 8,
  },
  undoButtonText: {
    color: '#E57373', 
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuditLogScreen;