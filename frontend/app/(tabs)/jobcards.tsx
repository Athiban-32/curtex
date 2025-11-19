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
import { listenToJobCards, updateJobCard } from '../../utils/firebaseUtils';
import { JobCard } from '../../types';
import { format } from 'date-fns';
import { generateJobCardPDF } from '../../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';

export default function JobCards() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<JobCard | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const router = useRouter();

  const STAGES = [
    { stage: 1, name: 'Fabric Received', icon: 'cube' },
    { stage: 2, name: 'Cutting Complete', icon: 'cut' },
    { stage: 3, name: 'Stitching Complete', icon: 'shirt' },
    { stage: 4, name: 'Quality Check', icon: 'checkmark-circle' },
    { stage: 5, name: 'Packing Done', icon: 'archive' },
  ];

  useEffect(() => {
    const unsubscribe = listenToJobCards((data) => {
      setJobCards(data);
    });

    return () => unsubscribe();
  }, []);

  const handleGeneratePDF = async (jobCard: JobCard) => {
    try {
      const uri = await generateJobCardPDF(jobCard);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Job Card ${jobCard.jobCardNumber}`,
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  // --- THIS IS THE FIX ---
  // We now send 'null' instead of 'undefined' when un-checking a stage
  const updateStage = async (jobCard: JobCard, newStage: number) => {
    try {
      // Find the current state of the stage
      const currentStageStatus = jobCard.stageStatus.find(s => s.stage === newStage);
      const isCurrentlyCompleted = currentStageStatus?.completed || false;

      const updatedStageStatus = jobCard.stageStatus.map(s => 
        s.stage === newStage 
          ? { 
              ...s, 
              completed: !isCurrentlyCompleted, 
              // Set to new Date() if marking complete, set to null if un-marking
              completedDate: !isCurrentlyCompleted ? new Date() : null 
            } 
          : s
      );

      // Calculate new current stage
      const completedStages = updatedStageStatus.filter(s => s.completed).length;
      
      await updateJobCard(jobCard.id!, {
        currentStage: completedStages,
        stageStatus: updatedStageStatus,
      });

      // Optimistically update the local state for a smooth UI
      setSelectedCard(prev => {
        if (!prev) return null;
        const completedCount = updatedStageStatus.filter(s => s.completed).length;
        return {
          ...prev,
          stageStatus: updatedStageStatus,
          currentStage: completedCount
        };
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update stage');
    }
  };

  const renderJobCardItem = ({ item }: { item: JobCard }) => {
    const progress = (item.currentStage / 5) * 100;
    const isComplete = item.currentStage === 5;

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobCardHeader}>
          <View>
            <Text style={styles.jobCardNumber}>{item.jobCardNumber}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          {isComplete && (
            <View style={styles.completeBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>

        <View style={styles.jobCardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PO Number:</Text>
            <Text style={styles.detailValue}>{item.poNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fabric:</Text>
            <Text style={styles.detailValue}>{item.fabricCode} - {item.fabricDesign}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery:</Text>
            <Text style={styles.detailValue}>{format(item.delivery, 'dd-MMM-yyyy')}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Progress: Stage {item.currentStage}/5</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.stagesContainer}>
          {STAGES.map((stage) => {
            // Ensure stageStatus exists before finding
            const stageData = item.stageStatus?.find(s => s.stage === stage.stage);
            const isCompleted = stageData?.completed || false;

            return (
              <View key={stage.stage} style={styles.stageIndicator}>
                <View style={[
                  styles.stageCircle,
                  isCompleted && styles.stageCircleCompleted
                ]}>
                  <Ionicons 
                    name={isCompleted ? 'checkmark' : stage.icon as any} 
                    size={16} 
                    color={isCompleted ? '#fff' : '#999'} 
                  />
                </View>
                <Text style={[styles.stageText, isCompleted && styles.stageTextCompleted]}>
                  {stage.stage}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.jobCardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleGeneratePDF(item)}
          >
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedCard(item);
              setShowStageModal(true);
            }}
          >
            <Ionicons name="construct" size={20} color="#2196F3" />
            <Text style={styles.actionButtonText}>Update Stage</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={jobCards}
        renderItem={renderJobCardItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No job cards found</Text>
            <Text style={styles.emptySubtext}>Create a new job card from the form below</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/job-card-form' as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showStageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Production Stages</Text>
              <TouchableOpacity onPress={() => setShowStageModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedCard && (
              <View style={styles.stagesList}>
                <Text style={styles.cardInfo}>{selectedCard.jobCardNumber}</Text>
                
                {STAGES.map((stage) => {
                  // Ensure stageStatus exists before finding
                  const stageData = selectedCard.stageStatus?.find(s => s.stage === stage.stage);
                  const isCompleted = stageData?.completed || false;

                  return (
                    <TouchableOpacity
                      key={stage.stage}
                      style={[styles.stageItem, isCompleted && styles.stageItemCompleted]}
                      onPress={() => updateStage(selectedCard, stage.stage)}
                    >
                      <View style={styles.stageItemLeft}>
                        <Ionicons 
                          name={stage.icon as any} 
                          size={24} 
                          color={isCompleted ? '#4CAF50' : '#666'} 
                        />
                        <View style={styles.stageItemText}>
                          <Text style={[styles.stageName, isCompleted && styles.stageNameCompleted]}>
                            Stage {stage.stage}: {stage.name}
                          </Text>
                          {/* This is where the time crash was. It's now fixed. */}
                          {isCompleted && stageData?.completedDate && (
                            <Text style={styles.stageDate}>
                              {format(stageData.completedDate, 'dd-MMM-yyyy')}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons 
                        name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'} 
                        size={28} 
                        color={isCompleted ? '#4CAF50' : '#ddd'} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ... (Your existing styles) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  jobCard: {
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
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jobCardNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  completeBadge: {
    padding: 4,
  },
  jobCardDetails: {
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
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  stageIndicator: {
    alignItems: 'center',
    gap: 4,
  },
  stageCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stageText: {
    fontSize: 12,
    color: '#999',
  },
  stageTextCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  jobCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
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
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stagesList: {
    padding: 16,
  },
  cardInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  stageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  stageItemCompleted: {
    backgroundColor: '#E8F5E9',
  },
  stageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  stageItemText: {
    flex: 1,
  },
  stageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  stageNameCompleted: {
    color: '#2E7D32',
  },
  stageDate: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
});