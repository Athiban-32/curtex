import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listenToDyeingOrders, addDyeingOrder, updateDyeingOrder } from '../../utils/firebaseUtils';
import { DyeingOrder } from '../../types';
import { format } from 'date-fns';
import { generateDyeingOrderPDF } from '../../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';

export default function DyeingOrders() {
  const [orders, setOrders] = useState<DyeingOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fabricCode: '',
    fabricType: '',
    width: '',
    quantity: '',
    color: '',
    dyeingHouse: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToDyeingOrders((data) => {
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!formData.fabricCode || !formData.quantity || !formData.dyeingHouse) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await addDyeingOrder({
        fabricCode: formData.fabricCode,
        fabricType: formData.fabricType,
        width: parseFloat(formData.width) || 0,
        quantity: parseFloat(formData.quantity),
        color: formData.color,
        dyeingHouse: formData.dyeingHouse,
        location: formData.location,
        date: new Date(),
        received: false,
      });

      Alert.alert('Success', 'Dyeing order created');
      setShowForm(false);
      setFormData({
        fabricCode: '',
        fabricType: '',
        width: '',
        quantity: '',
        color: '',
        dyeingHouse: '',
        location: '',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (order: DyeingOrder) => {
    try {
      const uri = await generateDyeingOrderPDF(order);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Dyeing Order ${order.orderNumber}`,
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const toggleReceived = async (order: DyeingOrder) => {
    try {
      await updateDyeingOrder(order.id!, { received: !order.received });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderOrderItem = ({ item }: { item: DyeingOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.orderDate}>{format(item.date, 'dd-MMM-yyyy')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.received ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.received ? 'Received' : 'Pending'}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fabric Code:</Text>
          <Text style={styles.detailValue}>{item.fabricCode}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.fabricType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>{item.quantity}m</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Color:</Text>
          <Text style={styles.detailValue}>{item.color}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dyeing House:</Text>
          <Text style={styles.detailValue}>{item.dyeingHouse}</Text>
        </View>
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
          onPress={() => toggleReceived(item)}
        >
          <Ionicons 
            name={item.received ? "close-circle" : "checkmark-circle"} 
            size={20} 
            color={item.received ? "#FF5252" : "#4CAF50"} 
          />
          <Text style={styles.actionButtonText}>
            {item.received ? 'Mark Pending' : 'Mark Received'}
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
            <Ionicons name="color-palette-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No dyeing orders found</Text>
            <Text style={styles.emptySubtext}>Create your first dyeing order</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowForm(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Dyeing Order</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fabric Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fabricCode}
                  onChangeText={(text) => setFormData({ ...formData, fabricCode: text })}
                  placeholder="e.g., M01"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fabric Type</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fabricType}
                  onChangeText={(text) => setFormData({ ...formData, fabricType: text })}
                  placeholder="e.g., Moss"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Width</Text>
                <TextInput
                  style={styles.input}
                  value={formData.width}
                  onChangeText={(text) => setFormData({ ...formData, width: text })}
                  placeholder="e.g., 54"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity (meters) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="e.g., 100"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={formData.color}
                  onChangeText={(text) => setFormData({ ...formData, color: text })}
                  placeholder="e.g., Royal Blue"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dyeing House *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dyeingHouse}
                  onChangeText={(text) => setFormData({ ...formData, dyeingHouse: text })}
                  placeholder="e.g., Avni 5001"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="e.g., Warehouse A"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creating...' : 'Create Order'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
