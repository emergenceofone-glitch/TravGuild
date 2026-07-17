import { Injectable, signal, computed } from '@angular/core';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Operator {
  id: string;
  name: string;
  rep: number;
  region: string;
  service: string;
  status: 'online' | 'offline' | 'busy';
  description: string;
  verified: boolean;
  uid: string;
}

export interface HiringRecord {
  id: string;
  operatorId: string;
  missionObjective: string;
  platinumOffered: number;
  timestamp: string;
  requesterId: string;
}

export interface MediaClip {
  id: string;
  game: string;
  date: string;
  description: string;
  quality: 'S-Tier' | 'A-Tier' | 'B-Tier' | 'C-Tier';
  status: 'Intake' | 'Processing' | 'Ready' | 'Published';
  platform?: string;
  uid: string;
}

export interface ArsenalItem {
  id: string;
  name: string;
  type: 'Warframe' | 'Primary' | 'Secondary' | 'Melee';
  status: 'Mastered' | 'Forma-ing' | 'Building';
  formaCount: number;
  uid: string;
}

export interface CodexEntry {
  id: string;
  type: string;
  name?: string;
  discovery: string;
  value: number;
  location: string;
  operator: string;
  isLocked: boolean;
  decryptionProgress: number; // 0-100
  uid: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuildService {
  readonly operators = signal<Operator[]>([]);
  readonly clips = signal<MediaClip[]>([]);
  readonly arsenal = signal<ArsenalItem[]>([]);
  readonly codex = signal<CodexEntry[]>([]);

  // Computed Stats
  readonly totalClips = computed(() => this.clips().length);
  readonly publishedCount = computed(() => this.clips().filter(c => c.status === 'Published').length);
  readonly pendingCount = computed(() => this.clips().filter(c => c.status !== 'Published').length);

  private unsubscribes: (() => void)[] = [];

  constructor() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.initListeners();
      } else {
        this.clearListeners();
        this.operators.set([]);
        this.clips.set([]);
        this.arsenal.set([]);
        this.codex.set([]);
      }
    });
  }

  private initListeners() {
    this.clearListeners();

    this.unsubscribes.push(
      onSnapshot(collection(db, 'operators'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Operator));
        this.operators.set(data);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'operators'))
    );

    this.unsubscribes.push(
      onSnapshot(collection(db, 'clips'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaClip));
        this.clips.set(data);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'clips'))
    );

    this.unsubscribes.push(
      onSnapshot(collection(db, 'arsenal'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArsenalItem));
        this.arsenal.set(data);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'arsenal'))
    );

    this.unsubscribes.push(
      onSnapshot(collection(db, 'codex'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodexEntry));
        this.codex.set(data);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'codex'))
    );
  }

  private clearListeners() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }

  async updateOperator(id: string, data: Partial<Operator>) {
    try {
      await updateDoc(doc(db, 'operators', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `operators/${id}`);
    }
  }

  async addOperator(op: Omit<Operator, 'id' | 'uid'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'operators'), { ...op, uid: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'operators');
    }
  }

  getHiringHistoryQuery(operatorId: string) {
    return query(collection(db, 'hiring_history'), where('operatorId', '==', operatorId));
  }

  async addHiringRecord(record: Omit<HiringRecord, 'id' | 'timestamp' | 'requesterId'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'hiring_history'), {
        ...record,
        timestamp: new Date().toISOString(),
        requesterId: auth.currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'hiring_history');
    }
  }

  // --- Arsenal Actions ---
  async addArsenalItem(item: Omit<ArsenalItem, 'id' | 'uid'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'arsenal'), { ...item, uid: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'arsenal');
    }
  }

  async updateArsenalItem(id: string, data: Partial<ArsenalItem>) {
    try {
      await updateDoc(doc(db, 'arsenal', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `arsenal/${id}`);
    }
  }

  async deleteArsenalItem(id: string) {
    try {
      await deleteDoc(doc(db, 'arsenal', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `arsenal/${id}`);
    }
  }

  // --- Media Flow Actions ---
  async addClip(clip: Omit<MediaClip, 'id' | 'uid'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'clips'), { ...clip, uid: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clips');
    }
  }

  async moveClip(clipId: string, newStatus: MediaClip['status']) {
    try {
      await updateDoc(doc(db, 'clips', clipId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clips/${clipId}`);
    }
  }

  // --- Codex Actions ---
  async startDecryption(id: string) {
    try {
      await updateDoc(doc(db, 'codex', id), { decryptionProgress: 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `codex/${id}`);
    }
  }

  async updateDecryptionProgress(id: string, progress: number) {
    const unlocked = progress >= 100;
    try {
      await updateDoc(doc(db, 'codex', id), { 
        decryptionProgress: progress,
        isLocked: !unlocked
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `codex/${id}`);
    }
  }

  async addCodexEntry(entry: Omit<CodexEntry, 'id' | 'uid'>) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'codex'), { ...entry, uid: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'codex');
    }
  }
}