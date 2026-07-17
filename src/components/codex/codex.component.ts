import { Component, inject, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuildService } from '../../services/guild.service';
import { GoogleGenAI, Type } from "@google/genai";

@Component({
  selector: 'app-codex',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">Codex Archives</h2>
          <p class="text-gray-400 text-sm">Decrypt secured intelligence data.</p>
        </div>
        <div class="flex items-center gap-4">
          <button (click)="generateArtifact()" [disabled]="isGenerating()"
                  class="px-4 py-2 bg-tenno-gold text-black font-mono font-bold rounded hover:bg-white transition-all disabled:opacity-50">
            {{ isGenerating() ? 'Analyzing...' : 'Generate Artifact Entry' }}
          </button>
          <div class="flex bg-gray-900 rounded p-1">
            <button (click)="sortType.set('discovery')"
                    [class.bg-gray-800]="sortType() === 'discovery'"
                    class="px-3 py-1.5 text-xs text-white font-mono rounded transition-colors">Date</button>
            <button (click)="sortType.set('value')" 
                    [class.bg-gray-800]="sortType() === 'value'"
                    class="px-3 py-1.5 text-xs text-white font-mono rounded transition-colors">Value</button>
          </div>
          <div class="text-right">
             <div class="text-tenno-gold text-2xl font-mono font-bold">{{ unlockedCount() }} / {{ totalCount() }}</div>
             <div class="text-xs text-gray-500 uppercase">Archives Decrypted</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6">
        @for (entry of sortedCodex(); track entry.id) {
          <div class="relative overflow-hidden glass-panel rounded-lg border border-gray-800 transition-all hover:border-gray-700">
            <!-- Background Matrix Effect for Locked -->
            @if (entry.isLocked) {
              <div class="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXN5aG55aG55aG55aG55aG55aG55aG55aG55aG55aG55aG55aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LfpjDCLnTeMx2/giphy.gif')] opacity-[0.03] pointer-events-none mix-blend-screen bg-cover"></div>
            }

            <div class="relative p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-xs font-bold text-tenno-cyan tracking-widest uppercase border border-tenno-cyan/30 px-2 py-0.5 rounded">
                    {{ entry.type }}
                  </span>
                  @if (!entry.isLocked) {
                    <span class="text-xs font-bold text-tenno-gold flex items-center gap-1">
                      <span>🔓</span> UNLOCKED
                    </span>
                  }
                </div>
                
                <h3 class="text-xl font-bold text-white mb-2">
                  {{ entry.isLocked ? 'ENCRYPTED DATA SEGMENT' : (entry.name || entry.discovery) }}
                </h3>
                
                <p class="text-gray-300 mt-2 text-sm italic">
                  {{ entry.isLocked ? 'Encrypted Data' : (entry.description || 'No description available.') }}
                </p>
                
                <div class="flex gap-4 text-sm text-gray-400 font-mono mt-4">
                  <div class="flex items-center gap-1">
                    <span class="text-gray-600">LOC:</span> {{ entry.location }}
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-gray-600">OP:</span> {{ entry.operator }}
                  </div>
                </div>
              </div>

              <!-- Right Action Side -->
              <div class="w-full md:w-64 shrink-0">
                @if (entry.isLocked) {
                  @if (entry.decryptionProgress > 0 && entry.decryptionProgress < 100) {
                    <div class="space-y-2">
                      <div class="flex justify-between text-xs font-mono text-tenno-cyan">
                        <span class="animate-pulse">DECRYPTING...</span>
                        <span>{{ entry.decryptionProgress | number:'1.0-0' }}%</span>
                      </div>
                      <div class="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div class="h-full bg-gradient-to-r from-tenno-cyan to-white transition-all duration-100"
                             [style.width.%]="entry.decryptionProgress"></div>
                      </div>
                    </div>
                  } @else {
                    <div class="flex flex-col items-end gap-2">
                      <div class="text-2xl font-bold text-tenno-gold font-mono">{{ entry.value | number }} <span class="text-sm">PLT</span></div>
                      <button (click)="startDecryption(entry.id)" 
                              class="w-full py-3 bg-tenno-cyan/10 hover:bg-tenno-cyan/20 border border-tenno-cyan/50 hover:border-tenno-cyan text-tenno-cyan font-bold uppercase tracking-wider transition-all rounded flex items-center justify-center gap-2 group">
                        <svg class="w-4 h-4 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Initialize Hack
                      </button>
                    </div>
                  }
                } @else {
                  <div class="p-4 bg-tenno-gold/5 border border-tenno-gold/20 rounded">
                     <div class="text-xs text-tenno-gold mb-1">MARKET VALUE</div>
                     <div class="text-2xl font-bold text-white">{{ entry.value | number }} <span class="text-sm text-gray-500">PLATINUM</span></div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CodexComponent implements OnDestroy {
  service = inject(GuildService);
  activeTimers: any = {};
  sortType = signal<'value' | 'discovery'>('discovery');
  isGenerating = signal(false);
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  totalCount = computed(() => this.service.codex().length);
  unlockedCount = computed(() => this.service.codex().filter(e => !e.isLocked).length);
  
  sortedCodex = computed(() => {
    const list = [...this.service.codex()];
    if (this.sortType() === 'value') {
      return list.sort((a, b) => b.value - a.value); // Descending order
    } else {
      return list.sort((a, b) => new Date(b.discovery).getTime() - new Date(a.discovery).getTime());
    }
  });

  async generateArtifact() {
    this.isGenerating.set(true);
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a new ancient artifact for a codex archive. Return JSON.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
              value: { type: Type.NUMBER }
            }
          }
        }
      });
      const artifact = JSON.parse(response.text);
      await this.service.addCodexEntry({
        type: 'Ancient Artifact',
        name: artifact.name,
        discovery: new Date().toISOString(),
        isLocked: true,
        decryptionProgress: 0,
        location: artifact.location,
        value: artifact.value,
        description: artifact.description,
        operator: 'AI_AGENT'
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate artifact.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  startDecryption(id: string) {
    if (this.activeTimers[id]) return;
    
    this.service.startDecryption(id);
    
    // Simulate decryption process
    let progress = 0;
    this.activeTimers[id] = setInterval(() => {
      progress += 2; // Speed of decryption
      if (progress >= 100) {
        progress = 100;
        clearInterval(this.activeTimers[id]);
        delete this.activeTimers[id];
      }
      this.service.updateDecryptionProgress(id, progress);
    }, 50);
  }

  ngOnDestroy() {
    Object.values(this.activeTimers).forEach((timer: any) => clearInterval(timer));
  }
}