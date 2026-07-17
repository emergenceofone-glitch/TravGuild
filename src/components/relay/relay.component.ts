import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuildService, Operator, HiringRecord } from '../../services/guild.service';
import { onSnapshot } from 'firebase/firestore';                
import { OperationType, handleFirestoreError } from '../../services/guild.service';
import { GoogleGenAI, Type } from "@google/genai";

@Component({
  selector: 'app-relay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">Active Operators</h2>
          <p class="text-gray-400 text-sm">Contract elite Tenno for specialized services.</p>
        </div>
        <div class="flex items-center gap-4 text-xs font-mono">
          <button (click)="autoRecruit()" [disabled]="isRecruiting() || !ai" class="px-4 py-2 bg-tenno-gold/10 text-tenno-gold border border-tenno-gold/30 rounded hover:bg-tenno-gold/20 transition-all font-bold tracking-wider uppercase disabled:opacity-50 flex items-center gap-2">
            @if(isRecruiting()) {
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Recruiting...</span>
            } @else {
              <span>Auto-Recruit</span>
            }
          </button>
          <span class="px-3 py-1 bg-tenno-cyan/10 text-tenno-cyan border border-tenno-cyan/30 rounded">
            NETWORK: STABLE
          </span>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 glass-panel p-4 rounded-lg border border-gray-800">
        <div class="flex gap-2 font-mono text-xs">
          <button (click)="activeStatus.set('all')" [class.bg-tenno-gold/20]="activeStatus() === 'all'" class="px-3 py-1 rounded border border-gray-700 text-white">ALL</button>
          <button (click)="activeStatus.set('online')" [class.bg-tenno-cyan/20]="activeStatus() === 'online'" class="px-3 py-1 rounded border border-gray-700 text-white">ONLINE</button>
          <button (click)="activeStatus.set('offline')" [class.bg-gray-600/20]="activeStatus() === 'offline'" class="px-3 py-1 rounded border border-gray-700 text-white">OFFLINE</button>
          <button (click)="activeStatus.set('busy')" [class.bg-tenno-red/20]="activeStatus() === 'busy'" class="px-3 py-1 rounded border border-gray-700 text-white">BUSY</button>
        </div>
        <div class="flex gap-2 font-mono text-xs">
          <button (click)="activeRegion.set('all')" [class.bg-tenno-gold/20]="activeRegion() === 'all'" class="px-3 py-1 rounded border border-gray-700 text-white">ALL REGIONS</button>
          @for (region of uniqueRegions(); track region) {
            <button (click)="activeRegion.set(region)" [class.bg-tenno-gold/20]="activeRegion() === region" class="px-3 py-1 rounded border border-gray-700 text-white">{{ region | uppercase }}</button>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (op of filteredOperators(); track op.id) {
          <div class="glass-panel p-5 rounded-lg border-l-4 hover:bg-white/5 transition-all group cursor-pointer"
               (click)="openProfile(op)"
               [class.border-l-tenno-cyan]="op.status === 'online'"
               [class.border-l-gray-600]="op.status === 'offline'"
               [class.border-l-tenno-red]="op.status === 'busy'">
            
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5">
                    <div class="relative w-3 h-3">
                      @if (op.status === 'online') {
                        <div class="absolute inset-0 bg-tenno-cyan rounded-full animate-ping opacity-75"></div>
                        <div class="relative w-3 h-3 bg-tenno-cyan rounded-full"></div>
                      } @else if (op.status === 'busy') {
                        <div class="relative w-3 h-3 bg-tenno-red rounded-sm animate-pulse rotate-45"></div>
                      } @else {
                        <div class="relative w-3 h-3 bg-gray-600 rounded-full border border-gray-400"></div>
                      }
                    </div>
                    <span class="text-[10px] font-mono uppercase opacity-70"
                          [class.text-tenno-cyan]="op.status === 'online'"
                          [class.text-tenno-red]="op.status === 'busy'"
                          [class.text-gray-500]="op.status === 'offline'">{{ op.status }}</span>
                </div>
                <h3 class="font-bold text-lg text-white group-hover:text-tenno-gold transition-colors">
                  {{ op.name }}
                </h3>
              </div>
              <div class="flex items-center gap-1 text-tenno-gold font-mono font-bold">
                <span>★</span> {{ op.rep }}
              </div>
            </div>

            <div class="mb-4">
              <div class="text-xs text-gray-500 uppercase tracking-widest mb-1">{{ op.region }}</div>
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="px-2 py-1 bg-tenno-gold/10 text-tenno-gold text-xs border border-tenno-gold/30 rounded">
                  {{ op.service }}
                </span>
                @if (op.verified) {
                  <span class="px-2 py-1 bg-tenno-cyan/10 text-tenno-cyan text-xs border border-tenno-cyan/30 rounded flex items-center gap-1">
                    <span>✓</span> Verified
                  </span>
                }
              </div>
              <p class="text-sm text-gray-400 leading-relaxed line-clamp-2">{{ op.description }}</p>
            </div>

            <button (click)="openProfile(op)" class="w-full py-2 border border-white/20 text-white hover:bg-white/10 font-bold uppercase text-sm tracking-wider transition-all rounded-sm mb-2">
              View Details
            </button>
            <button (click)="openHireModal(op, $event)" class="w-full py-2 border border-tenno-gold/50 text-tenno-gold hover:bg-tenno-gold hover:text-black font-bold uppercase text-sm tracking-wider transition-all rounded-sm flex items-center justify-center gap-2">
              <span>Request Protocol</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        }
      </div>


      <!-- Profile Modal -->
      @if (selectedProfile()) {
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" (click)="closeProfile()">
          <div class="bg-tenno-panel border border-tenno-gold/30 rounded-lg max-w-2xl w-full p-6 relative" (click)="$event.stopPropagation()">
            <button (click)="closeProfile()" class="absolute top-4 right-4 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div class="flex items-start gap-6 mb-6">
              <div class="w-24 h-24 rounded-full bg-gray-800 border-2 border-tenno-gold flex items-center justify-center text-3xl font-bold text-gray-500">
                {{ selectedProfile()?.name?.charAt(0) }}
              </div>
              <div>
                <h2 class="text-3xl font-bold text-white mb-1">{{ selectedProfile()?.name }}</h2>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-tenno-gold font-bold">★ {{ selectedProfile()?.rep }}</span>
                  <span class="text-gray-400 text-sm">{{ selectedProfile()?.region }}</span>
                  @if (selectedProfile()?.verified) {
                    <span class="text-tenno-cyan text-xs border border-tenno-cyan/30 px-2 py-0.5 rounded">Verified</span>
                  }
                </div>
                <div class="inline-block px-3 py-1 bg-tenno-gold/10 text-tenno-gold border border-tenno-gold/30 rounded text-sm">
                  {{ selectedProfile()?.service }}
                </div>
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <h4 class="text-xs text-gray-500 uppercase tracking-wider mb-1">About</h4>
                <p class="text-gray-300">{{ selectedProfile()?.description }}</p>
              </div>

              <div class="mt-4 pt-4 border-t border-white/10">
                 <h4 class="text-xs text-gray-500 uppercase tracking-wider mb-2">Hiring History</h4>
                 @if (hiringHistory().length === 0) {
                   <p class="text-sm text-gray-600 italic">No record of previous contracts found.</p>
                 } @else {
                   <div class="space-y-2">
                     @for (record of hiringHistory(); track record.id) {
                       <div class="p-3 bg-black/30 rounded border border-white/5 text-sm">
                         <div class="flex justify-between items-center mb-1">
                           <span class="text-tenno-gold font-bold">{{ record.platinumOffered }} Platinum</span>
                           <span class="text-gray-500 text-xs">{{ record.timestamp | date:'short' }}</span>
                         </div>
                         <p class="text-gray-300">{{ record.missionObjective }}</p>
                       </div>
                     }
                   </div>
                 }
              </div>
              
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <h4 class="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                  <div class="flex items-center gap-2">
                    <div class="relative w-3 h-3">
                      @if (selectedProfile()?.status === 'online') {
                        <div class="absolute inset-0 bg-tenno-cyan rounded-full animate-ping opacity-75"></div>
                        <div class="relative w-3 h-3 bg-tenno-cyan rounded-full"></div>
                      } @else if (selectedProfile()?.status === 'busy') {
                        <div class="relative w-3 h-3 bg-tenno-red rounded-sm animate-pulse rotate-45"></div>
                      } @else {
                        <div class="relative w-3 h-3 bg-gray-600 rounded-full border border-gray-400"></div>
                      }
                    </div>
                    <span class="text-white capitalize">{{ selectedProfile()?.status }}</span>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs text-gray-500 uppercase tracking-wider mb-1">Operator ID</h4>
                  <span class="text-gray-300 font-mono text-sm">{{ selectedProfile()?.id }}</span>
                </div>
              </div>
            </div>
            
            <div class="mt-8 flex justify-end gap-3">
              <button (click)="closeProfile()" class="px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5 transition-colors">
                Close
              </button>
              <button (click)="toggleVerified(selectedProfile()!)" 
                      class="px-4 py-2 border rounded transition-colors"
                      [class.border-tenno-cyan]="!selectedProfile()?.verified"
                      [class.text-tenno-cyan]="!selectedProfile()?.verified"
                      [class.hover:bg-tenno-cyan/10]="!selectedProfile()?.verified"
                      [class.border-tenno-red]="selectedProfile()?.verified"
                      [class.text-tenno-red]="selectedProfile()?.verified"
                      [class.hover:bg-tenno-red/10]="selectedProfile()?.verified">
                {{ selectedProfile()?.verified ? 'Unverify Operator' : 'Verify Operator' }}
              </button>
              <button (click)="openHireModal(selectedProfile()!, $event); closeProfile()" class="px-6 py-2 bg-tenno-gold text-black font-bold uppercase tracking-wider rounded hover:bg-white transition-colors">
                Hire Operator
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Hire Modal -->
      @if (hiringOperator()) {
        <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" (click)="closeHireModal()">
          <div class="bg-tenno-panel border border-tenno-cyan/30 rounded-lg max-w-md w-full p-6 relative" (click)="$event.stopPropagation()">
            <h3 class="text-xl font-bold text-white mb-2">Initiate Contract</h3>
            <p class="text-gray-400 text-sm mb-6">Requesting services from <span class="text-tenno-cyan font-bold">{{ hiringOperator()?.name }}</span>.</p>
            
            <form (ngSubmit)="submitContract()" class="space-y-4">
              <div>
                <label class="block text-xs text-gray-400 uppercase mb-1">Mission Details</label>
                <textarea [(ngModel)]="contractDetails" name="details" rows="3" required placeholder="Describe the objective..." class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-cyan outline-none resize-none"></textarea>
              </div>
              <div>
                <label class="block text-xs text-gray-400 uppercase mb-1">Proposed Platinum</label>
                <input type="number" [(ngModel)]="contractPlat" name="plat" min="1" required class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-cyan outline-none">
              </div>
              
              <div class="pt-4 flex justify-end gap-3">
                <button type="button" (click)="closeHireModal()" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" class="px-6 py-2 bg-tenno-cyan text-black font-bold uppercase tracking-wider rounded hover:bg-white transition-colors">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class RelayComponent implements OnDestroy {
  service = inject(GuildService);
  ai: GoogleGenAI | null = null;
  
  isRecruiting = signal(false);

  activeStatus = signal<'all' | 'online' | 'offline' | 'busy'>('all');
  activeRegion = signal<string>('all');
  hiringHistory = signal<HiringRecord[]>([]);
  private historyUnsub: (() => void) | null = null;

  uniqueRegions = computed(() => {
    return Array.from(new Set(this.service.operators().map(op => op.region)));
  });

  filteredOperators = computed(() => {
    return this.service.operators().filter(op => {
      const statusMatch = this.activeStatus() === 'all' || op.status === this.activeStatus();
      const regionMatch = this.activeRegion() === 'all' || op.region === this.activeRegion();
      return statusMatch && regionMatch;
    }).sort((a, b) => b.rep - a.rep);
  });

  selectedProfile = signal<Operator | null>(null);
  hiringOperator = signal<Operator | null>(null);

  contractDetails = '';
  contractPlat = 50;

  constructor() {
    if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
  }

  async autoRecruit() {
    if (!this.ai) return;
    this.isRecruiting.set(true);
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a new elite mercenary operator profile for a sci-fi space ninja guild. Return JSON.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rep: { type: Type.NUMBER, description: "Reputation score from 1 to 100" },
              region: { type: Type.STRING, description: "A sci-fi region or planet" },
              service: { type: Type.STRING, description: "Type of service provided, e.g. Assassination, Defense, Sabotage" },
              description: { type: Type.STRING, description: "A short badass backstory" },
              status: { type: Type.STRING, enum: ["online", "offline", "busy"] },
            }
          }
        }
      });
      const data = JSON.parse(response.text);
      await this.service.addOperator({
        name: data.name,
        rep: data.rep,
        region: data.region,
        service: data.service,
        status: data.status,
        description: data.description,
        verified: Math.random() > 0.5
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.isRecruiting.set(false);
    }
  }

  openProfile(op: Operator) {
    this.selectedProfile.set(op);
    this.loadHistory(op.id);
  }

  loadHistory(operatorId: string) {
    if (this.historyUnsub) this.historyUnsub();
    const q = this.service.getHiringHistoryQuery(operatorId);
    this.historyUnsub = onSnapshot(q, (snapshot) => {
      this.hiringHistory.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HiringRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'hiring_history'));
  }

  closeProfile() {
    this.selectedProfile.set(null);
    if (this.historyUnsub) this.historyUnsub();
    this.hiringHistory.set([]);
  }

  ngOnDestroy() {
    if (this.historyUnsub) this.historyUnsub();
  }

  async toggleVerified(op: Operator) {
    await this.service.updateOperator(op.id, { verified: !op.verified });
    const updatedOp = this.service.operators().find(o => o.id === op.id);
    if (updatedOp) {
      this.selectedProfile.set(updatedOp);
    }
  }
  
  openHireModal(op: Operator, event: Event) {
    event.stopPropagation();
    this.hiringOperator.set(op);
    this.contractDetails = '';
    this.contractPlat = 50;
  }

  closeHireModal() {
    this.hiringOperator.set(null);
  }

  async submitContract() {
    if (this.contractDetails && this.contractPlat > 0 && this.hiringOperator()) {
      await this.service.addHiringRecord({
        operatorId: this.hiringOperator()!.id,
        missionObjective: this.contractDetails,
        platinumOffered: this.contractPlat
      });
      this.closeHireModal();
    }
  }
}