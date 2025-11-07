import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addJobCard } from '../utils/firebaseUtils';
import { JobCardSpec, StageStatus } from '../types';

export default function JobCardForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    poNumber: '',
    customerName: '',
    deliveryDays: '7',
    fabricCode: '',
    fabricDesign: '',
    fabricWidth: '',
    totalSets: '',
    hangingMechanism: '',
    sideFold: '',
    velcroQuantity: '',
    velcroColour: '',
    otherSpecs: '',
    otherComments: '',
    approvedBy: '',
  });

  const [specifications, setSpecifications] = useState<JobCardSpec[]>([
    { slNo: 1, drop: '', ready: '', width: '', setPieces: '', meters: '', notes: '' },
  ]);

  const [loading, setLoading] = useState(false);

  const addSpecificationRow = () => {
    setSpecifications([
      ...specifications,
      { slNo: specifications.length + 1, drop: '', ready: '', width: '', setPieces: '', meters: '', notes: '' },
    ]);
  };

  const updateSpecification = (index: number, field: keyof JobCardSpec, value: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };

  const removeSpecificationRow = (index: number) => {
    if (specifications.length > 1) {
      const updated = specifications.filter((_, i) => i !== index);
      // Renumber
      updated.forEach((spec, i) => spec.slNo = i + 1);
      setSpecifications(updated);
    }
  };

  const handleSubmit = async () => {
    if (!formData.poNumber || !formData.customerName || !formData.fabricCode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(formData.deliveryDays || '7'));

      // Initialize stage status
      const stageStatus: StageStatus[] = [
        { stage: 1, name: 'Fabric Received', completed: false },
        { stage: 2, name: 'Cutting Complete', completed: false },
        { stage: 3, name: 'Stitching Complete', completed: false },
        { stage: 4, name: 'Quality Check', completed: false },
        { stage: 5, name: 'Packing Done', completed: false },
      ];

      await addJobCard({
        poNumber: formData.poNumber,
        customerName: formData.customerName,
        issuedOn: new Date(),
        delivery: deliveryDate,
        fabricCode: formData.fabricCode,
        fabricDesign: formData.fabricDesign,
        fabricWidth: parseFloat(formData.fabricWidth) || 0,
        specifications,
        totalSets: parseInt(formData.totalSets) || 0,
        hangingMechanism: formData.hangingMechanism,
        sideFold: formData.sideFold,
        velcroQuantity: parseFloat(formData.velcroQuantity) || 0,
        velcroColour: formData.velcroColour,
        otherSpecs: formData.otherSpecs,
        otherComments: formData.otherComments,
        approvedBy: formData.approvedBy,
        currentStage: 0,
        stageStatus,
      });

      Alert.alert('Success', 'Job card created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create job card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Job Card</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PO Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.poNumber}
              onChangeText={(text) => setFormData({ ...formData, poNumber: text })}
              placeholder="e.g., PO-2025-001"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.customerName}
              onChangeText={(text) => setFormData({ ...formData, customerName: text })}
              placeholder="Enter customer name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery (Days from now)</Text>
            <TextInput
              style={styles.input}
              value={formData.deliveryDays}
              onChangeText={(text) => setFormData({ ...formData, deliveryDays: text })}
              placeholder="7"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raw Material Specification</Text>
          
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
            <Text style={styles.label}>Fabric Design</Text>
            <TextInput
              style={styles.input}
              value={formData.fabricDesign}
              onChangeText={(text) => setFormData({ ...formData, fabricDesign: text })}
              placeholder="e.g., Ivory"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fabric Width</Text>
            <TextInput
              style={styles.input}
              value={formData.fabricWidth}
              onChangeText={(text) => setFormData({ ...formData, fabricWidth: text })}
              placeholder="e.g., 48"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job Order Specifications</Text>
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
                  <Text style={styles.smallLabel}>1 Set Pieces</Text>
                  <TextInput
                    style={styles.input}
                    value={spec.setPieces}
                    onChangeText={(text) => updateSpecification(index, 'setPieces', text)}
                    placeholder="Pieces"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.smallLabel}>Meters</Text>
                <TextInput
                  style={styles.input}
                  value={spec.meters}
                  onChangeText={(text) => updateSpecification(index, 'meters', text)}
                  placeholder="Meters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.smallLabel}>Notes</Text>
                <TextInput
                  style={styles.input}
                  value={spec.notes}
                  onChangeText={(text) => updateSpecification(index, 'notes', text)}
                  placeholder="Additional notes"
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>No. of Sets</Text>
            <TextInput
              style={styles.input}
              value={formData.totalSets}
              onChangeText={(text) => setFormData({ ...formData, totalSets: text })}
              placeholder="e.g., 10"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hanging Mechanism</Text>
            <TextInput
              style={styles.input}
              value={formData.hangingMechanism}
              onChangeText={(text) => setFormData({ ...formData, hangingMechanism: text })}
              placeholder="e.g., Eyelets"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Side Fold</Text>
            <TextInput
              style={styles.input}
              value={formData.sideFold}
              onChangeText={(text) => setFormData({ ...formData, sideFold: text })}
              placeholder="e.g., 2 inches"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Velcro Quantity</Text>
            <TextInput
              style={styles.input}
              value={formData.velcroQuantity}
              onChangeText={(text) => setFormData({ ...formData, velcroQuantity: text })}
              placeholder="e.g., 10"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Velcro Colour</Text>
            <TextInput
              style={styles.input}
              value={formData.velcroColour}
              onChangeText={(text) => setFormData({ ...formData, velcroColour: text })}
              placeholder="e.g., White"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Other Specs</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.otherSpecs}
              onChangeText={(text) => setFormData({ ...formData, otherSpecs: text })}
              placeholder="Additional specifications"
              multiline
              numberOfLines={3}
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
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Approved By</Text>
            <TextInput
              style={styles.input}
              value={formData.approvedBy}
              onChangeText={(text) => setFormData({ ...formData, approvedBy: text })}
              placeholder="Approver name"
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
            {loading ? 'Creating...' : 'Create Job Card'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 20,
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
});
