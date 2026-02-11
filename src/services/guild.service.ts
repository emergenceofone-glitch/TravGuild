import { Injectable, signal, computed } from '@angular/core';

export interface Operator {
  id: string;
  name: string;
  rep: number;
  region: string;
  service: string;
  status: 'online' | 'offline' | 'busy';
  description: string;
  verified: boolean;
}

export interface MediaClip {
  id: string;
  game: string;
  date: string;
  description: string;
  quality: 'S-Tier' | 'A-Tier' | 'B-Tier' | 'C-Tier';
  status: 'Intake' | 'Processing' | 'Ready' | 'Published';
  platform?: string;
}

export interface CodexEntry {
  id: string;
  type: string;
  discovery: string;
  value: number;
  location: string;
  operator: string;
  isLocked: boolean;
  decryptionProgress: number; // 0-100
}

@Injectable({
  providedIn: 'root'
})
export class GuildService {
  // Operators Data
  readonly operators = signal<Operator[]>([
    { 
      id: 'o1', name: 'Void_Hunter_77', rep: 4.9, region: 'Earth', service: 'Eidolon Carry', 
      status: 'online', description: '5x3 Tridolon hunts, all shards guaranteed', verified: true 
    },
    { 
      id: 'o2', name: 'Platinum_Appraiser', rep: 4.8, region: 'Relay Network', service: 'Riven Analysis', 
      status: 'offline', description: 'Expert valuations for god-roll Rivens', verified: false 
    },
    { 
      id: 'o3', name: 'Circuit_Optimizer', rep: 5.0, region: 'Zariman Ten Zero', service: 'Farm Routes', 
      status: 'online', description: 'Steel Path efficiency maps & tile optimizations', verified: false 
    },
    {
      id: 'o4', name: 'Nora_Night_Fan', rep: 4.2, region: 'Orbiter', service: 'Nightwave Help',
      status: 'busy', description: 'Helping with weekly challenges', verified: true
    }
  ]);

  // Media Flow Data (Kanban)
  readonly clips = signal<MediaClip[]>([
    { id: 'WF_001', game: 'Warframe', date: '2026-02-10', description: 'Eidolon Capture 5x3', quality: 'S-Tier', status: 'Published', platform: 'YouTube' },
    { id: 'WF_002', game: 'Warframe', date: '2026-02-11', description: 'Rubico God Roll', quality: 'A-Tier', status: 'Ready', platform: 'TikTok' },
    { id: 'WF_003', game: 'NMS', date: '2026-02-12', description: 'Base Build Speedrun', quality: 'B-Tier', status: 'Processing' },
    { id: 'WF_004', game: 'Warframe', date: '2026-02-13', description: 'Steel Path Fail', quality: 'C-Tier', status: 'Intake' },
    { id: 'WF_005', game: 'Warframe', date: '2026-02-13', description: 'Netracell Solo', quality: 'A-Tier', status: 'Intake' },
  ]);

  // Codex Data
  readonly codex = signal<CodexEntry[]>([
    {
      id: 'codex_001', type: 'God-Roll Riven', discovery: 'Rubico Prime (+CC +MS +DMG)',
      value: 4500, location: 'Kuva Fortress', operator: 'Void_Hunter_77', isLocked: true, decryptionProgress: 0
    },
    {
      id: 'codex_002', type: 'Optimal Farm Route', discovery: 'Void Cascade Efficiency Map',
      value: 1200, location: 'Zariman Ten Zero', operator: 'Circuit_Optimizer', isLocked: true, decryptionProgress: 0
    },
    {
      id: 'codex_003', type: 'Market Insider', discovery: 'Arcane Energize Price Drop Prediction',
      value: 800, location: 'Maroo\'s Bazaar', operator: 'Platinum_Appraiser', isLocked: true, decryptionProgress: 0
    }
  ]);

  // Computed Stats
  readonly totalClips = computed(() => this.clips().length);
  readonly publishedCount = computed(() => this.clips().filter(c => c.status === 'Published').length);
  readonly pendingCount = computed(() => this.clips().filter(c => c.status !== 'Published').length);

  // Actions
  moveClip(clipId: string, newStatus: MediaClip['status']) {
    this.clips.update(current => 
      current.map(c => c.id === clipId ? { ...c, status: newStatus } : c)
    );
  }

  startDecryption(id: string) {
    // Simulation logic handles in component usually, but state update here
    this.codex.update(entries => 
      entries.map(e => e.id === id ? { ...e, decryptionProgress: 1 } : e)
    );
  }

  updateDecryptionProgress(id: string, progress: number) {
    this.codex.update(entries => 
      entries.map(e => {
        if (e.id !== id) return e;
        const newProgress = progress;
        const unlocked = newProgress >= 100;
        return { 
          ...e, 
          decryptionProgress: newProgress,
          isLocked: !unlocked
        };
      })
    );
  }
}