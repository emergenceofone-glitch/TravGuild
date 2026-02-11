import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuildService, MediaClip } from '../../services/guild.service';

@Component({
  selector: 'app-media-flow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col animate-fadeIn">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">MediaFlow Pipeline</h2>
          <p class="text-gray-400 text-sm">Manage acquisition, processing, and publishing of Guild assets.</p>
        </div>
        <button class="px-4 py-2 bg-tenno-gold text-black font-bold uppercase tracking-wider rounded hover:bg-white transition-colors flex items-center gap-2">
          <span>+ Manual Intake</span>
        </button>
      </div>

      <!-- Kanban Board -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        @for (column of columns; track column.status) {
          <div class="flex flex-col h-full bg-white/5 rounded-lg border border-white/5">
            <!-- Header -->
            <div class="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center rounded-t-lg">
              <h3 class="font-mono font-bold text-gray-300">{{ column.label }}</h3>
              <span class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {{ getClipsByStatus(column.status).length }}
              </span>
            </div>

            <!-- Drop Zone / List -->
            <div class="flex-1 p-3 space-y-3 overflow-y-auto min-h-[300px]">
              @for (clip of getClipsByStatus(column.status); track clip.id) {
                <div class="p-3 bg-tenno-panel border border-gray-700 rounded hover:border-tenno-gold/50 group transition-all relative">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-mono text-gray-500">{{ clip.id }}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                          [ngClass]="getQualityClass(clip.quality)">
                      {{ clip.quality }}
                    </span>
                  </div>
                  
                  <div class="text-sm font-bold text-white mb-1 leading-tight">{{ clip.description }}</div>
                  <div class="text-xs text-gray-400 mb-3">{{ clip.game }} • {{ clip.date }}</div>

                  <!-- Actions -->
                  <div class="flex justify-between items-center pt-2 border-t border-gray-800">
                    @if (clip.status !== 'Intake') {
                      <button (click)="moveBack(clip)" class="text-gray-500 hover:text-white" title="Move Back">
                         ←
                      </button>
                    } @else { <div></div> }
                    
                    @if (clip.status !== 'Published') {
                      <button (click)="advance(clip)" 
                              class="text-tenno-cyan hover:text-white font-bold text-xs uppercase tracking-wide flex items-center gap-1">
                         Next Phase →
                      </button>
                    } @else {
                      <a href="#" class="text-tenno-gold text-xs flex items-center gap-1">
                        View Live <span class="text-[10px]">↗</span>
                      </a>
                    }
                  </div>
                </div>
              }
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
    /* Custom Scrollbar for columns */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #333; }
  `]
})
export class MediaFlowComponent {
  service = inject(GuildService);

  columns: {status: MediaClip['status'], label: string}[] = [
    { status: 'Intake', label: '1. INTAKE' },
    { status: 'Processing', label: '2. PROCESSING' },
    { status: 'Ready', label: '3. READY' },
    { status: 'Published', label: '4. PUBLISHED' }
  ];

  getClipsByStatus(status: MediaClip['status']) {
    return this.service.clips().filter(c => c.status === status);
  }

  getQualityClass(quality: string) {
    switch (quality) {
      case 'S-Tier': return 'bg-tenno-gold/10 text-tenno-gold border-tenno-gold/30';
      case 'A-Tier': return 'bg-tenno-cyan/10 text-tenno-cyan border-tenno-cyan/30';
      default: return 'bg-gray-800 text-gray-400 border-gray-600';
    }
  }

  advance(clip: MediaClip) {
    const order: MediaClip['status'][] = ['Intake', 'Processing', 'Ready', 'Published'];
    const idx = order.indexOf(clip.status);
    if (idx < order.length - 1) {
      this.service.moveClip(clip.id, order[idx + 1]);
    }
  }

  moveBack(clip: MediaClip) {
    const order: MediaClip['status'][] = ['Intake', 'Processing', 'Ready', 'Published'];
    const idx = order.indexOf(clip.status);
    if (idx > 0) {
      this.service.moveClip(clip.id, order[idx - 1]);
    }
  }
}