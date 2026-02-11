import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuildService } from '../../services/guild.service';

@Component({
  selector: 'app-relay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">Active Operators</h2>
          <p class="text-gray-400 text-sm">Contract elite Tenno for specialized services.</p>
        </div>
        <div class="flex gap-2 text-xs font-mono">
          <span class="px-3 py-1 bg-tenno-cyan/10 text-tenno-cyan border border-tenno-cyan/30 rounded">
            NETWORK: STABLE
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (op of service.operators(); track op.id) {
          <div class="glass-panel p-5 rounded-lg border-l-4 hover:bg-white/5 transition-all group"
               [class.border-l-tenno-cyan]="op.status === 'online'"
               [class.border-l-gray-600]="op.status === 'offline'"
               [class.border-l-tenno-red]="op.status === 'busy'">
            
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full animate-pulse"
                     [class.bg-tenno-cyan]="op.status === 'online'"
                     [class.bg-gray-600]="op.status === 'offline'"
                     [class.bg-tenno-red]="op.status === 'busy'"></div>
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
              <p class="text-sm text-gray-400 leading-relaxed">{{ op.description }}</p>
            </div>

            <button class="w-full py-2 mt-2 border border-tenno-gold/50 text-tenno-gold hover:bg-tenno-gold hover:text-black font-bold uppercase text-sm tracking-wider transition-all rounded-sm flex items-center justify-center gap-2">
              <span>Request Protocol</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
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
export class RelayComponent {
  service = inject(GuildService);
}