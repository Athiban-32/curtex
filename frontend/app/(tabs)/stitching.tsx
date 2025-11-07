import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listenToStitchingWorkOrders, updateStitchingWorkOrder } from '../../utils/firebaseUtils';
import { StitchingWorkOrder } from '../../types';
import { format } from 'date-fns';
import { generateStitchingWorkOrderPDF } from '../../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';

export default function StitchingOrders() {
  const [orders, setOrders] = useState<StitchingWorkOrder[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = listenToStitchingWorkOrders((data) => {
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

  const handleGeneratePDF = async (order: StitchingWorkOrder) => {
    try {
      const uri = await generateStitchingWorkOrderPDF(order);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Stitching Order ${order.workOrderNumber}`,
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const markCompleted = async (order: StitchingWorkOrder) => {
    try {
      await updateStitchingWorkOrder(order.id!, {
        completedOn: order.completedOn ? undefined : new Date(),
      });
      Alert.alert('Success', `Order ${order.completedOn ? 'marked pending' : 'marked completed'}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const renderOrderItem = ({ item }: { item: StitchingWorkOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.workOrderNumber}</Text>
          <Text style={styles.orderDate}>{format(item.issuedOn, 'dd-MMM-yyyy')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.completedOn ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.completedOn ? 'Completed' : 'In Progress'}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reference Job:</Text>
          <Text style={styles.detailValue}>{item.referenceJobCardNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Issued To:</Text>
          <Text style={styles.detailValue}>{item.issuedTo}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fabric Colour:</Text>
          <Text style={styles.detailValue}>{item.fabricColour}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>{item.total}</Text>
        </View>
        {item.completedOn && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed On:</Text>
            <Text style={styles.detailValue}>{format(item.completedOn, 'dd-MMM-yyyy')}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleGeneratePDF(item)}
        >
          <Ionicons name="document-text" size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Generate PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => markCompleted(item)}
        >
          <Ionicons 
            name={item.completedOn ? "close-circle" : "checkmark-circle"} 
            size={20} 
            color={item.completedOn ? "#FF5252" : "#4CAF50"} 
          />
          <Text style={styles.actionButtonText}>
            {item.completedOn ? 'Mark Pending' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cut-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No stitching orders found</Text>
            <Text style={styles.emptySubtext}>Create work orders from job cards</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/stitching-form' as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
