import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { FabricInventory, FabricMovement, DyeingOrder, JobCard, StitchingWorkOrder } from '../types';

// Generate auto-incrementing numbers
export const generateOrderNumber = async (prefix: string): Promise<string> => {
  const counterRef = doc(db, 'counters', prefix);
  const counterSnap = await getDoc(counterRef);
  
  let nextNumber = 1;
  if (counterSnap.exists()) {
    nextNumber = counterSnap.data().count + 1;
    await updateDoc(counterRef, { count: nextNumber });
  } else {
    await addDoc(collection(db, 'counters'), { id: prefix, count: nextNumber });
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Fabric Inventory
export const addFabricInventory = async (fabric: Omit<FabricInventory, 'id'>) => {
  const rollNumber = await generateRollNumber();
  const fabricData = {
    ...fabric,
    rollNumber,
    remainingQuantity: fabric.quantity,
    inwardDate: Timestamp.fromDate(fabric.inwardDate as Date),
  };
  return await addDoc(collection(db, 'fabricInventory'), fabricData);
};

export const generateRollNumber = async (): Promise<number> => {
  const counterRef = doc(db, 'counters', 'rollNumber');
  const counterSnap = await getDoc(counterRef);
  
  let nextNumber = 1;
  if (counterSnap.exists()) {
    nextNumber = counterSnap.data().count + 1;
    await updateDoc(counterRef, { count: nextNumber });
  } else {
    await addDoc(collection(db, 'counters'), { id: 'rollNumber', count: nextNumber });
  }
  
  return nextNumber;
};

export const updateFabricInventory = async (id: string, data: Partial<FabricInventory>) => {
  const docRef = doc(db, 'fabricInventory', id);
  return await updateDoc(docRef, data);
};

export const listenToFabricInventory = (callback: (data: FabricInventory[]) => void) => {
  const q = query(collection(db, 'fabricInventory'), orderBy('rollNumber', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const fabrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      inwardDate: doc.data().inwardDate?.toDate(),
    })) as FabricInventory[];
    callback(fabrics);
  });
};

// Fabric Movements
export const addFabricMovement = async (movement: Omit<FabricMovement, 'id'>) => {
  const movementData = {
    ...movement,
    date: Timestamp.fromDate(movement.date as Date),
  };
  
  // Update remaining quantity in inventory
  const fabricRef = doc(db, 'fabricInventory', movement.rollId);
  const fabricSnap = await getDoc(fabricRef);
  
  if (fabricSnap.exists()) {
    const currentQuantity = fabricSnap.data().remainingQuantity;
    const newQuantity = movement.movementType === 'outward' 
      ? currentQuantity - movement.quantity 
      : currentQuantity + movement.quantity;
    
    await updateDoc(fabricRef, { 
      remainingQuantity: newQuantity,
      status: newQuantity <= 0 ? 'consumed' : 'active'
    });
  }
  
  return await addDoc(collection(db, 'fabricMovements'), movementData);
};

export const listenToFabricMovements = (callback: (data: FabricMovement[]) => void) => {
  const q = query(collection(db, 'fabricMovements'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
    })) as FabricMovement[];
    callback(movements);
  });
};

// Dyeing Orders
export const addDyeingOrder = async (order: Omit<DyeingOrder, 'id' | 'orderNumber'>) => {
  const orderNumber = await generateOrderNumber('DYE');
  const orderData = {
    ...order,
    orderNumber,
    date: Timestamp.fromDate(order.date as Date),
  };
  return await addDoc(collection(db, 'dyeingOrders'), orderData);
};

export const updateDyeingOrder = async (id: string, data: Partial<DyeingOrder>) => {
  const docRef = doc(db, 'dyeingOrders', id);
  return await updateDoc(docRef, data);
};

export const listenToDyeingOrders = (callback: (data: DyeingOrder[]) => void) => {
  const q = query(collection(db, 'dyeingOrders'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
    })) as DyeingOrder[];
    callback(orders);
  });
};

// Job Cards
export const addJobCard = async (jobCard: Omit<JobCard, 'id' | 'jobCardNumber'>) => {
  const jobCardNumber = await generateOrderNumber('JOB');
  const jobCardData = {
    ...jobCard,
    jobCardNumber,
    issuedOn: Timestamp.fromDate(jobCard.issuedOn as Date),
    delivery: Timestamp.fromDate(jobCard.delivery as Date),
    completedOn: jobCard.completedOn ? Timestamp.fromDate(jobCard.completedOn as Date) : null,
  };
  return await addDoc(collection(db, 'jobCards'), jobCardData);
};

export const updateJobCard = async (id: string, data: Partial<JobCard>) => {
  const docRef = doc(db, 'jobCards', id);
  const updateData: any = { ...data };
  
  if (data.completedOn) {
    updateData.completedOn = Timestamp.fromDate(data.completedOn as Date);
  }
  
  return await updateDoc(docRef, updateData);
};

export const listenToJobCards = (callback: (data: JobCard[]) => void) => {
  const q = query(collection(db, 'jobCards'), orderBy('issuedOn', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const jobCards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedOn: doc.data().issuedOn?.toDate(),
      delivery: doc.data().delivery?.toDate(),
      completedOn: doc.data().completedOn?.toDate(),
    })) as JobCard[];
    callback(jobCards);
  });
};

// Stitching Work Orders
export const addStitchingWorkOrder = async (order: Omit<StitchingWorkOrder, 'id' | 'workOrderNumber'>) => {
  const workOrderNumber = await generateOrderNumber('STW');
  const orderData = {
    ...order,
    workOrderNumber,
    issuedOn: Timestamp.fromDate(order.issuedOn as Date),
    completedOn: order.completedOn ? Timestamp.fromDate(order.completedOn as Date) : null,
  };
  return await addDoc(collection(db, 'stitchingWorkOrders'), orderData);
};

export const updateStitchingWorkOrder = async (id: string, data: Partial<StitchingWorkOrder>) => {
  const docRef = doc(db, 'stitchingWorkOrders', id);
  const updateData: any = { ...data };
  
  if (data.completedOn) {
    updateData.completedOn = Timestamp.fromDate(data.completedOn as Date);
  }
  
  return await updateDoc(docRef, updateData);
};

export const listenToStitchingWorkOrders = (callback: (data: StitchingWorkOrder[]) => void) => {
  const q = query(collection(db, 'stitchingWorkOrders'), orderBy('issuedOn', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedOn: doc.data().issuedOn?.toDate(),
      completedOn: doc.data().completedOn?.toDate(),
    })) as StitchingWorkOrder[];
    callback(orders);
  });
};
