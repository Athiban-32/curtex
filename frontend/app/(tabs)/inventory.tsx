import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listenToFabricInventory, addFabricMovement } from '../../utils/firebaseUtils';
import { FabricInventory } from '../../types';
import FabricInwardForm from '../../components/FabricInwardForm';
import { format } from 'date-fns';

export default function Inventory() {
  const [fabrics, setFabrics] = useState<FabricInventory[]>([]);
  const [filteredFabrics, setFilteredFabrics] = useState<FabricInventory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInwardForm, setShowInwardForm] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<FabricInventory | null>(null);
  const [outwardQuantity, setOutwardQuantity] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'consumed'>('all');

  useEffect(() => {
    const unsubscribe = listenToFabricInventory((data) => {
      setFabrics(data);
      setFilteredFabrics(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = fabrics;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.fabricCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.fabricDesign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.rollNumber.toString().includes(searchQuery)
      );
    }

    setFilteredFabrics(filtered);
  }, [searchQuery, filterStatus, fabrics]);

  const handleOutward = async () => {
    if (!selectedFabric || !outwardQuantity) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }

    const quantity = parseFloat(outwardQuantity);
    if (quantity > selectedFabric.remainingQuantity) {
      Alert.alert('Error', 'Quantity exceeds available stock');
      return;
    }

    try {
      await addFabricMovement({
        rollId: selectedFabric.id!,
        movementType: 'outward',
        quantity,
        date: new Date(),
      });

      Alert.alert('Success', 'Outward movement recorded');
      setShowOutwardModal(false);
      setSelectedFabric(null);
      setOutwardQuantity('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to record outward movement');
    }
  };

  const renderFabricItem = ({ item }: { item: FabricInventory }) => (
    <View style={styles.fabricCard}>
      <View style={styles.fabricHeader}>
        <View>
          <Text style={styles.fabricCode}>{item.fabricCode}</Text>
          <Text style={styles.fabricDesign}>{item.fabricDesign}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#4CAF50' : '#FF5252' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.fabricDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="barcode" size={16} color="#666" />
          <Text style={styles.detailText}>Roll #{item.rollNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="resize" size={16} color="#666" />
          <Text style={styles.detailText}>Width: {item.width}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{item.location || 'No location'}</Text>
        </View>
      </View>

      <View style={styles.quantitySection}>
        <View>
          <Text style={styles.quantityLabel}>Remaining</Text>
          <Text style={styles.quantityValue}>{item.remainingQuantity}m</Text>
        </View>
        <View>
          <Text style={styles.quantityLabel}>Original</Text>
          <Text style={styles.quantityValue}>{item.quantity}m</Text>
        </View>
        <TouchableOpacity
          style={styles.outwardButton}
          onPress={() => {
            setSelectedFabric(item);
            setShowOutwardModal(true);
          }}
          disabled={item.status === 'consumed'}
        >
          <Ionicons name="arrow-forward" size={20} color="#fff" />
          <Text style={styles.outwardButtonText}>Outward</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inwardDate}>
        Inward: {format(item.inwardDate, 'dd-MMM-yyyy')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by code, design, or roll number"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('active')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'active' && styles.filterButtonTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'consumed' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('consumed')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'consumed' && styles.filterButtonTextActive]}>
              Consumed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredFabrics}
        renderItem={renderFabricItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No fabric inventory found</Text>
            <Text style={styles.emptySubtext}>Add your first fabric entry</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowInwardForm(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showInwardForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <FabricInwardForm onClose={() => setShowInwardForm(false)} />
      </Modal>

      <Modal
        visible={showOutwardModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOutwardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Outward Movement</Text>
            
            {selectedFabric && (
              <View>
                <Text style={styles.modalLabel}>
                  {selectedFabric.fabricCode} - Roll #{selectedFabric.rollNumber}
                </Text>
                <Text style={styles.modalSubtext}>
                  Available: {selectedFabric.remainingQuantity}m
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter quantity (meters)"
                  value={outwardQuantity}
                  onChangeText={setOutwardQuantity}
                  keyboardType="numeric"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowOutwardModal(false);
                      setSelectedFabric(null);
                      setOutwardQuantity('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleOutward}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  fabricCard: {
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
  fabricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fabricCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fabricDesign: {
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
  fabricDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#999',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  outwardButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  outwardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inwardDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
