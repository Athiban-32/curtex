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
import { addFabricInventory } from '../utils/firebaseUtils';
import { FabricInventory } from '../types';

interface Props {
  onClose: () => void;
}

export default function FabricInwardForm({ onClose }: Props) {
  const [formData, setFormData] = useState({
    fabricCode: '',
    fabricDesign: '',
    width: '',
    lotNumber: '',
    quantity: '',
    location: '',
    colorCategory: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.fabricCode || !formData.width || !formData.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await addFabricInventory({
        fabricCode: formData.fabricCode,
        fabricDesign: formData.fabricDesign,
        width: parseFloat(formData.width),
        lotNumber: formData.lotNumber,
        quantity: parseFloat(formData.quantity),
        location: formData.location,
        colorCategory: formData.colorCategory,
        inwardDate: new Date(),
        rollNumber: 0, // Will be auto-generated
        status: 'active',
        remainingQuantity: parseFloat(formData.quantity),
      });

      Alert.alert('Success', 'Fabric added to inventory');
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add fabric');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Fabric Inward Entry</Text>
          <TouchableOpacity onPress={onClose}>
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
            <Text style={styles.label}>Fabric Design</Text>
            <TextInput
              style={styles.input}
              value={formData.fabricDesign}
              onChangeText={(text) => setFormData({ ...formData, fabricDesign: text })}
              placeholder="e.g., Ivory"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Width *</Text>
            <TextInput
              style={styles.input}
              value={formData.width}
              onChangeText={(text) => setFormData({ ...formData, width: text })}
              placeholder="e.g., 48"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lot Number</Text>
            <TextInput
              style={styles.input}
              value={formData.lotNumber}
              onChangeText={(text) => setFormData({ ...formData, lotNumber: text })}
              placeholder="e.g., LOT-001"
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
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="e.g., Warehouse A"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color Category</Text>
            <TextInput
              style={styles.input}
              value={formData.colorCategory}
              onChangeText={(text) => setFormData({ ...formData, colorCategory: text })}
              placeholder="e.g., 1002 Pace"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add to Inventory'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
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
