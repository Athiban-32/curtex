import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listenToFabricInventory, listenToJobCards, listenToDyeingOrders } from '../../utils/firebaseUtils';
import { FabricInventory, JobCard, DyeingOrder } from '../../types';
import { useNavigation, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase.config'; // Import auth from your config

export default function Dashboard() {
  const [fabrics, setFabrics] = useState<FabricInventory[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [dyeingOrders, setDyeingOrders] = useState<DyeingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigation = useNavigation();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          router.replace('/'); 
        },
      },
    ]);
  };

  const navigateToAuditLog = () => {
    // Navigate to the new audit log screen
    router.push('/(tabs)/audit-log');
  };

  // This adds the buttons to the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
          {/* AUDIT LOG BUTTON */}
          <TouchableOpacity onPress={navigateToAuditLog} style={{ marginRight: 12 }}>
            <Ionicons name="receipt-outline" size={28} color="#fff" />
          </TouchableOpacity>
          {/* LOGOUT BUTTON */}
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribeFabrics = listenToFabricInventory((data) => {
      setFabrics(data);
      setLoading(false);
    });

    const unsubscribeJobs = listenToJobCards((data) => {
      setJobCards(data);
    });

    const unsubscribeDyeing = listenToDyeingOrders((data) => {
      setDyeingOrders(data);
    });

    return () => {
      unsubscribeFabrics();
      unsubscribeJobs();
      unsubscribeDyeing();
    };
  }, []);

  const totalFabricRolls = fabrics.length;
  const activeFabricRolls = fabrics.filter(f => f.status === 'active').length;
  const totalQuantity = fabrics.reduce((sum, f) => sum + f.remainingQuantity, 0);
  const activeJobCards = jobCards.filter(j => j.currentStage < 5).length;
  const pendingDyeingOrders = dyeingOrders.filter(d => !d.received).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
       <View style={styles.header}>
         <Ionicons name="business" size={40} color="#4CAF50" />
         <Text style={styles.headerTitle}>Curtex Furnishing</Text>
         <Text style={styles.headerSubtitle}>Production Management</Text>
       </View>

       <View style={styles.statsGrid}>
         <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
           <Ionicons name="cube" size={32} color="#2196F3" />
           <Text style={styles.statValue}>{totalFabricRolls}</Text>
           <Text style={styles.statLabel}>Total Rolls</Text>
           <Text style={styles.statSubtext}>{activeFabricRolls} active</Text>
         </View>

         <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
           <Ionicons name="albums" size={32} color="#9C27B0" />
           <Text style={styles.statValue}>{totalQuantity.toFixed(1)}</Text>
           <Text style={styles.statLabel}>Total Quantity</Text>
           <Text style={styles.statSubtext}>meters</Text>
         </View>

         <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
           <Ionicons name="document-text" size={32} color="#4CAF50" />
           <Text style={styles.statValue}>{jobCards.length}</Text>
           <Text style={styles.statLabel}>Job Cards</Text>
           <Text style={styles.statSubtext}>{activeJobCards} in progress</Text>
         </View>

         <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
           <Ionicons name="color-palette" size={32} color="#FF9800" />
           <Text style={styles.statValue}>{dyeingOrders.length}</Text>
           <Text style={styles.statLabel}>Dyeing Orders</Text>
           <Text style={styles.statSubtext}>{pendingDyeingOrders} pending</Text>
         </View>
       </View>

       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Recent Activity</Text>
         
         {fabrics.slice(0, 5).map((fabric) => (
           <View key={fabric.id} style={styles.activityItem}>
             <View style={styles.activityIcon}>
               <Ionicons name="cube" size={20} color="#4CAF50" />
             </View>
             <View style={styles.activityContent}>
               <Text style={styles.activityTitle}>{fabric.fabricCode} - {fabric.fabricDesign}</Text>
               <Text style={styles.activitySubtitle}>
                 Roll #{fabric.rollNumber} | {fabric.remainingQuantity}m remaining
               </Text>
             </View>
             <View style={[styles.statusBadge, { backgroundColor: fabric.status === 'active' ? '#4CAF50' : '#FF5252' }]}>
               <Text style={styles.statusText}>{fabric.status}</Text>
             </View>
           </View>
         ))}
       </View>

       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Active Job Cards</Text>
         
         {jobCards.filter(j => j.currentStage < 5).slice(0, 5).map((job) => (
           <View key={job.id} style={styles.activityItem}>
             <View style={styles.activityIcon}>
               <Ionicons name="document-text" size={20} color="#2196F3" />
             </View>
             <View style={styles.activityContent}>
               <Text style={styles.activityTitle}>{job.jobCardNumber} - {job.customerName}</Text>
               <Text style={styles.activitySubtitle}>Stage {job.currentStage}/5</Text>
             </View>
             <View style={styles.progressContainer}>
               <View style={[styles.progressBar, { width: `${(job.currentStage / 5) * 100}%` }]} />
             </View>
           </View>
         ))}
       </View>
    </ScrollView>
  );
}

// --- STYLES (Your existing styles) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  progressContainer: {
    width: 60,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});