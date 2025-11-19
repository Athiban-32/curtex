import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase.config'; 
import { FabricInventory, FabricMovement, DyeingOrder, JobCard, StitchingWorkOrder, AuditLogEntry, StageStatus } from '../types';

// --- Helper functions to safely convert Timestamps or Dates ---
const safeToDate = (field: any): Date => {
  if (field && typeof field.toDate === 'function') {
    return field.toDate(); // It's a Firebase Timestamp
  }
  if (field instanceof Date) {
    return field; // It's already a JS Date
  }
  return new Date(); // Fallback
};

const safeToOptionalDate = (field: any): Date | undefined => {
  if (!field) {
    return undefined;
  }
  if (field && typeof field.toDate === 'function') {
    return field.toDate();
  }
  if (field instanceof Date) {
    return field;
  }
  return undefined;
};

// --- (Your existing generateOrderNumber and generateRollNumber functions) ---
export const generateOrderNumber = async (prefix: string): Promise<string> => {
  const counterRef = doc(db, 'counters', prefix);
  const counterSnap = await getDoc(counterRef);
  
  let nextNumber = 1;
  if (counterSnap.exists()) {
    nextNumber = counterSnap.data().count + 1;
    await updateDoc(counterRef, { count: nextNumber });
  } else {
    await setDoc(counterRef, { count: nextNumber });
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

export const generateRollNumber = async (): Promise<number> => {
  const counterRef = doc(db, 'counters', 'rollNumber');
  const counterSnap = await getDoc(counterRef);
  
  let nextNumber = 1;
  if (counterSnap.exists()) {
    nextNumber = counterSnap.data().count + 1;
    await updateDoc(counterRef, { count: nextNumber });
  } else {
    await setDoc(counterRef, { count: nextNumber });
  }
  
  return nextNumber;
};


// --- AUDIT LOG FUNCTIONS ---
export const addAuditLog = async (
  type: AuditLogEntry['type'],
  collectionName: string,
  docId: string,
  docRef: string,
  changeDetails: string
) => {
  try {
    const userEmail = auth.currentUser?.email || 'system';
    
    await addDoc(collection(db, 'auditLogs'), {
      type,
      userEmail,
      collectionName,
      docId,
      docRef,
      changeDetails,
      timestamp: Timestamp.now(), 
      canUndo: type === 'ADD',
    });
  } catch (error) {
    console.error("Failed to add audit log:", error);
  }
};

export const deleteDocument = async (collectionName: string, docId: string, docRefString: string) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
  
  await addAuditLog(
    'DELETE',
    collectionName,
    docId,
    docRefString,
    `Document deleted from ${collectionName} via Undo`
  );
};

export const listenToAuditLogs = (callback: (data: AuditLogEntry[]) => void) => {
  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: safeToDate(doc.data().timestamp), 
    })) as AuditLogEntry[];
    callback(logs);
  });
};

// --- (All your other add/update functions remain the same) ---
// --- Fabric Inventory ---
export const addFabricInventory = async (fabric: Omit<FabricInventory, 'id' | 'rollNumber'>) => {
  const rollNumber = await generateRollNumber();
  const fabricData = {
    ...fabric,
    rollNumber,
    remainingQuantity: fabric.quantity,
    inwardDate: Timestamp.fromDate(fabric.inwardDate as Date),
  };
  const docRef = await addDoc(collection(db, 'fabricInventory'), fabricData);
  
  await addAuditLog(
    'ADD', 
    'fabricInventory', 
    docRef.id, 
    fabric.fabricCode, 
    `Added Roll #${rollNumber} with ${fabric.quantity}m`
  );
  return docRef;
};

export const updateFabricInventory = async (id: string, data: Partial<FabricInventory>) => {
  const docRef = doc(db, 'fabricInventory', id);
  return await updateDoc(docRef, data);
};

// --- Fabric Movements ---
export const addFabricMovement = async (movement: Omit<FabricMovement, 'id'>) => {
  const movementData = {
    ...movement,
    date: Timestamp.fromDate(movement.date as Date),
  };
  
  const fabricRef = doc(db, 'fabricInventory', movement.rollId);
  const fabricSnap = await getDoc(fabricRef);
  
  if (fabricSnap.exists()) {
    const fabricData = fabricSnap.data();
    const currentQuantity = fabricData.remainingQuantity;
    const newQuantity = movement.movementType === 'outward' 
      ? currentQuantity - movement.quantity 
      : currentQuantity + movement.quantity;
      
    await updateDoc(fabricRef, { 
      remainingQuantity: newQuantity,
      status: newQuantity <= 0 ? 'consumed' : 'active'
    });

    await addAuditLog(
      'UPDATE',
      'fabricInventory',
      fabricSnap.id,
      fabricData.fabricCode,
      `Roll #${fabricData.rollNumber}: Quantity ${currentQuantity}m -> ${newQuantity}m`
    );
  }
  
  return await addDoc(collection(db, 'fabricMovements'), movementData);
};

// --- Dyeing Orders ---
export const addDyeingOrder = async (order: Omit<DyeingOrder, 'id' | 'orderNumber'>) => {
  const orderNumber = await generateOrderNumber('DYE');
  const orderData = {
    ...order,
    orderNumber,
    date: Timestamp.fromDate(order.date as Date),
  };
  const docRef = await addDoc(collection(db, 'dyeingOrders'), orderData);

  await addAuditLog(
    'ADD',
    'dyeingOrders',
    docRef.id,
    orderNumber,
    `Created dyeing order for ${order.quantity}m of ${order.fabricCode}`
  );
  return docRef;
};

export const updateDyeingOrder = async (id: string, data: Partial<DyeingOrder>) => {
  const docRef = doc(db, 'dyeingOrders', id);
  const docSnap = await getDoc(docRef);
  const oldData = docSnap.data();
  
  if (data.received !== undefined && oldData?.received !== data.received) {
    await addAuditLog(
      'STATUS_CHANGE',
      'dyeingOrders',
      id,
      oldData?.orderNumber,
      `Status changed: ${oldData?.received ? 'Received' : 'Pending'} -> ${data.received ? 'Received' : 'Pending'}`
    );
  }
  
  return await updateDoc(docRef, data);
};

// --- Job Cards ---
export const addJobCard = async (jobCard: Omit<JobCard, 'id' | 'jobCardNumber'>) => {
  const jobCardNumber = await generateOrderNumber('JOB');
  const jobCardData = {
    ...jobCard,
    jobCardNumber,
    issuedOn: Timestamp.fromDate(jobCard.issuedOn as Date),
    delivery: Timestamp.fromDate(jobCard.delivery as Date),
    completedOn: jobCard.completedOn ? Timestamp.fromDate(jobCard.completedOn as Date) : null,
  };
  const docRef = await addDoc(collection(db, 'jobCards'), jobCardData);
  
  await addAuditLog(
    'ADD',
    'jobCards',
    docRef.id,
    jobCardNumber,
    `Created job card for ${jobCard.customerName}`
  );
  return docRef;
};

// --- THIS IS THE FIX ---
// This function now robustly handles 'undefined' values
export const updateJobCard = async (id: string, data: Partial<JobCard>) => {
  const docRef = doc(db, 'jobCards', id);
  const docSnap = await getDoc(docRef);
  const oldData = docSnap.data();

  const updateData: any = { ...data };
  
  if (data.completedOn) {
    updateData.completedOn = Timestamp.fromDate(data.completedOn as Date);
  }
  
  // This will fix any existing or new bad data in the stageStatus array
  if (updateData.stageStatus) {
    updateData.stageStatus = updateData.stageStatus.map((stage: StageStatus) => {
      let newDate = stage.completedDate;
      
      if (newDate instanceof Date) {
        newDate = Timestamp.fromDate(newDate); // Convert JS Date to Timestamp
      } else if (newDate === undefined) {
        newDate = null; // Convert undefined to null
      }
      // 'null' remains 'null', 'Timestamp' remains 'Timestamp'

      return {
        ...stage,
        completedDate: newDate
      };
    });
  }
  
  if (data.currentStage !== undefined && oldData?.currentStage !== data.currentStage) {
    await addAuditLog(
      'STATUS_CHANGE',
      'jobCards',
      id,
      oldData?.jobCardNumber,
      `Stage updated: ${oldData?.currentStage}/5 -> ${data.currentStage}/5`
    );
  }
  
  return await updateDoc(docRef, updateData);
};

// --- Stitching Work Orders ---
export const addStitchingWorkOrder = async (order: Omit<StitchingWorkOrder, 'id' | 'workOrderNumber'>) => {
  const workOrderNumber = await generateOrderNumber('STW');
  const orderData = {
    ...order,
    workOrderNumber,
    issuedOn: Timestamp.fromDate(order.issuedOn as Date),
    completedOn: order.completedOn ? Timestamp.fromDate(order.completedOn as Date) : null,
  };
  const docRef = await addDoc(collection(db, 'stitchingWorkOrders'), orderData);
  
  await addAuditLog(
    'ADD',
    'stitchingWorkOrders',
    docRef.id,
    workOrderNumber,
    `Created stitching order for ${order.issuedTo} (Ref: ${order.referenceJobCardNumber})`
  );
  return docRef;
};

export const updateStitchingWorkOrder = async (id: string, data: Partial<StitchingWorkOrder>) => {
  const docRef = doc(db, 'stitchingWorkOrders', id);
  const docSnap = await getDoc(docRef);
  const oldData = docSnap.data();

  const updateData: any = { ...data };
  
  if (data.completedOn) { 
    updateData.completedOn = Timestamp.fromDate(data.completedOn as Date);
    await addAuditLog(
      'STATUS_CHANGE',
      'stitchingWorkOrders',
      id,
      oldData?.workOrderNumber,
      'Marked as Completed'
    );
  } else if (data.completedOn === null && oldData?.completedOn) { 
    updateData.completedOn = null;
    await addAuditLog(
      'STATUS_CHANGE',
      'stitchingWorkOrders',
      id,
      oldData?.workOrderNumber,
      'Marked as Pending'
    );
  }
  
  return await updateDoc(docRef, updateData);
};


// --- Your existing listener functions ---
// (The listenToJobCards function is also fixed here)

export const listenToFabricInventory = (callback: (data: FabricInventory[]) => void) => {
  const q = query(collection(db, 'fabricInventory'), orderBy('rollNumber', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const fabrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      inwardDate: safeToDate(doc.data().inwardDate), 
    })) as FabricInventory[];
    callback(fabrics);
  });
};

export const listenToFabricMovements = (callback: (data: FabricMovement[]) => void) => {
  const q = query(collection(db, 'fabricMovements'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: safeToDate(doc.data().date), 
    })) as FabricMovement[];
    callback(movements);
  });
};

export const listenToDyeingOrders = (callback: (data: DyeingOrder[]) => void) => {
  const q = query(collection(db, 'dyeingOrders'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: safeToDate(doc.data().date), 
    })) as DyeingOrder[];
    callback(orders);
  });
};

export const listenToJobCards = (callback: (data: JobCard[]) => void) => {
  const q = query(collection(db, 'jobCards'), orderBy('issuedOn', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const jobCards = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert dates inside the stageStatus array
      const convertedStageStatus = data.stageStatus?.map((stage: any) => ({
        ...stage,
        completedDate: safeToOptionalDate(stage.completedDate)
      })) || []; // Handle if stageStatus doesn't exist

      return {
        id: doc.id,
        ...data,
        issuedOn: safeToDate(data.issuedOn), 
        delivery: safeToDate(data.delivery), 
        completedOn: safeToOptionalDate(data.completedOn),
        stageStatus: convertedStageStatus, // Use the converted array
      };
    }) as JobCard[];
    callback(jobCards);
  });
};

export const listenToStitchingWorkOrders = (callback: (data: StitchingWorkOrder[]) => void) => {
  const q = query(collection(db, 'stitchingWorkOrders'), orderBy('issuedOn', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedOn: safeToDate(doc.data().issuedOn), 
      completedOn: safeToOptionalDate(doc.data().completedOn), 
    })) as StitchingWorkOrder[];
    callback(orders);
  });
};