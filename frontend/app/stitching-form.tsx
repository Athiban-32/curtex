import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addStitchingWorkOrder, listenToJobCards } from '../utils/firebaseUtils';
import { JobCard, StitchingSpec } from '../types';

export default function StitchingForm() {
  const router = useRouter();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [showJobCardPicker, setShowJobCardPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    issuedTo: '',
    fabricColour: '',
    otherComments: '',
    total: '',
  });

  const [specifications, setSpecifications] = useState<StitchingSpec[]>([
    { slNo: 1, drop: '', ready: '', width: '', pieces: '', receipt: '', stitchingSpecification: 'Hanging' },
    { slNo: 2, drop: '', ready: '', width: '', pieces: '', receipt: '', stitchingSpecification: 'Velcro' },
    { slNo: 3, drop: '', ready: '', width: '', pieces: '', receipt: '', stitchingSpecification: 'Side Fold' },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToJobCards((data) => {
      setJobCards(data);
    });

    return () => unsubscribe();
  }, []);

  const addSpecificationRow = () => {
    setSpecifications([
      ...specifications,
      { slNo: specifications.length + 1, drop: '', ready: '', width: '', pieces: '', receipt: '', stitchingSpecification: '' },
    ]);
  };

  const updateSpecification = (index: number, field: keyof StitchingSpec, value: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };

  const removeSpecificationRow = (index: number) => {
    if (specifications.length > 1) {
      const updated = specifications.filter((_, i) => i !== index);
      updated.forEach((spec, i) => spec.slNo = i + 1);
      setSpecifications(updated);
    }
  };

  const handleSubmit = async () => {
    if (!selectedJobCard || !formData.issuedTo) {
      Alert.alert('Error', 'Please select a job card and fill required fields');
      return;
    }

    setLoading(true);
    try {
      await addStitchingWorkOrder({
        referenceJobCardId: selectedJobCard.id!,
        referenceJobCardNumber: selectedJobCard.jobCardNumber,
        issuedOn: new Date(),
        issuedTo: formData.issuedTo,
        fabricColour: formData.fabricColour,
        specifications,
        otherComments: formData.otherComments,
        total: parseFloat(formData.total) || 0,
      });

      Alert.alert('Success', 'Stitching work order created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create stitching work order');
    } finally {
      setLoading(false);
    }
  };

  const renderJobCardItem = ({ item }: { item: JobCard }) => (
    <TouchableOpacity
      style={styles.jobCardItem}
      onPress={() => {
        setSelectedJobCard(item);
        setShowJobCardPicker(false);
      }}
    >
      <View>
        <Text style={styles.jobCardItemNumber}>{item.jobCardNumber}</Text>
        <Text style={styles.jobCardItemCustomer}>{item.customerName}</Text>
        <Text style={styles.jobCardItemFabric}>{item.fabricCode} - {item.fabricDesign}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Stitching Work Order</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reference Job Card</Text>
          
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowJobCardPicker(true)}
          >
            <View>
              {selectedJobCard ? (
                <>
                  <Text style={styles.pickerButtonLabel}>Selected Job Card</Text>
                  <Text style={styles.pickerButtonValue}>{selectedJobCard.jobCardNumber}</Text>
                  <Text style={styles.pickerButtonSubtext}>{selectedJobCard.customerName}</Text>
                </>
              ) : (
                <Text style={styles.pickerButtonPlaceholder}>Select a Job Card</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Order Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issued To *</Text>
            <TextInput
              style={styles.input}
              value={formData.issuedTo}
              onChangeText={(text) => setFormData({ ...formData, issuedTo: text })}
              placeholder="e.g., Tailor Name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fabric Colour</Text>
            <TextInput
              style={styles.input}
              value={formData.fabricColour}
              onChangeText={(text) => setFormData({ ...formData, fabricColour: text })}
              placeholder="e.g., Ivory"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stitching Specifications</Text>
            <TouchableOpacity onPress={addSpecificationRow} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add Row</Text>
            </TouchableOpacity>
          </View>

          {specifications.map((spec, index) => (
            <View key={index} style={styles.specCard}>
              <View style={styles.specHeader}>
                <Text style={styles.specTitle}>Row {spec.slNo}</Text>
                {specifications.length > 1 && (
                  <TouchableOpacity onPress={() => removeSpecificationRow(index)}>
                    <Ionicons name="trash" size={20} color="#FF5252" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.row}>
                <View style={styles.smallInput}>
                  <Text style={styles.smallLabel}>Drop</Text>
                  <TextInput
                    style={styles.input}
                    value={spec.drop}
                    onChangeText={(text) => updateSpecification(index, 'drop', text)}
                    placeholder="Drop"
                  />
                </View>
                <View style={styles.smallInput}>
                  <Text style={styles.smallLabel}>Ready</Text>
                  <TextInput
                    style={styles.input}
                    value={spec.ready}
                    onChangeText={(text) => updateSpecification(index, 'ready', text)}
                    placeholder="Ready"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.smallInput}>
                  <Text style={styles.smallLabel}>Width</Text>
                  <TextInput
                    style={styles.input}
                    value={spec.width}
                    onChangeText={(text) => updateSpecification(index, 'width', text)}
                    placeholder="Width"
                  />
                </View>
                <View style={styles.smallInput}>
                  <Text style={styles.smallLabel}>Pieces</Text>
                  <TextInput
                    style={styles.input}
                    value={spec.pieces}
                    onChangeText={(text) => updateSpecification(index, 'pieces', text)}
                    placeholder="Pieces"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.smallLabel}>Receipt</Text>
                <TextInput
                  style={styles.input}
                  value={spec.receipt}
                  onChangeText={(text) => updateSpecification(index, 'receipt', text)}
                  placeholder="Receipt info"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.smallLabel}>Stitching Specification</Text>
                <TextInput
                  style={styles.input}
                  value={spec.stitchingSpecification}
                  onChangeText={(text) => updateSpecification(index, 'stitchingSpecification', text)}
                  placeholder="e.g., Hanging, Velcro, Side Fold"
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total</Text>
            <TextInput
              style={styles.input}
              value={formData.total}
              onChangeText={(text) => setFormData({ ...formData, total: text })}
              placeholder="Total pieces/sets"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Other Comments</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.otherComments}
              onChangeText={(text) => setFormData({ ...formData, otherComments: text })}
              placeholder="Additional comments"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Work Order'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showJobCardPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Job Card</Text>
            <TouchableOpacity onPress={() => setShowJobCardPicker(false)}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={jobCards}
            renderItem={renderJobCardItem}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No job cards available</Text>
                <Text style={styles.emptySubtext}>Create a job card first</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerButtonLabel: {
    fontSize: 12,
    color: '#666',
  },
  pickerButtonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  pickerButtonSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  pickerButtonPlaceholder: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  specCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  specHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  specTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  smallInput: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  modalList: {
    padding: 16,
  },
  jobCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  jobCardItemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  jobCardItemCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  jobCardItemFabric: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
