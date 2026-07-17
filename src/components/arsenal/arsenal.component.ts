import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuildService, ArsenalItem } from '../../services/guild.service';

@Component({
  selector: 'app-arsenal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">Arsenal Status</h2>
          <p class="text-gray-400 text-sm">Monitor loadouts and forma investments.</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-right">
             <div class="text-tenno-gold text-2xl font-mono font-bold">{{ totalForma() }}</div>
             <div class="text-xs text-gray-500 uppercase">Total Forma Used</div>
          </div>
          <button (click)="showAddForm.set(!showAddForm())" class="btn-primary">
            {{ showAddForm() ? 'Cancel' : 'Add Item' }}
          </button>
        </div>
      </div>

      @if (showAddForm()) {
        <div class="glass-panel p-6 rounded-lg border border-tenno-gold/30 animate-fadeIn">
          <h3 class="text-lg font-bold text-white mb-4">Add New Arsenal Item</h3>
          <form (ngSubmit)="addItem()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 uppercase mb-1">Name</label>
              <input type="text" [(ngModel)]="newItem.name" name="name" required class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
            </div>
            <div>
              <label class="block text-xs text-gray-400 uppercase mb-1">Type</label>
              <select [(ngModel)]="newItem.type" name="type" required class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
                <option value="Warframe">Warframe</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Melee">Melee</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 uppercase mb-1">Status</label>
              <select [(ngModel)]="newItem.status" name="status" required class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
                <option value="Mastered">Mastered</option>
                <option value="Forma-ing">Forma-ing</option>
                <option value="Building">Building</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 uppercase mb-1">Forma Count</label>
              <input type="number" [(ngModel)]="newItem.formaCount" name="formaCount" min="0" required class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
            </div>
            <div class="md:col-span-2 flex justify-end">
              <button type="submit" class="btn-primary">Save Item</button>
            </div>
          </form>
        </div>
      }

      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="flex-1">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search arsenal..." class="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
        </div>
        <div class="flex gap-2">
          <select [(ngModel)]="filterType" class="bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
            <option value="All">All Types</option>
            <option value="Warframe">Warframe</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Melee">Melee</option>
          </select>
          <select [(ngModel)]="sortBy" class="bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-gold outline-none">
            <option value="name">Sort by Name</option>
            <option value="forma">Sort by Forma</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (item of filteredAndSortedArsenal(); track item.id) {
          <div class="glass-panel p-5 rounded-lg border-l-4 hover:bg-white/5 transition-all group relative"
               [class.border-l-tenno-gold]="item.status === 'Mastered'"
               [class.border-l-tenno-cyan]="item.status === 'Forma-ing'"
               [class.border-l-gray-600]="item.status === 'Building'">
            
            <button (click)="deleteItem(item.id)" class="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>

            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <h3 class="font-bold text-lg text-white group-hover:text-tenno-gold transition-colors">
                  {{ item.name }}
                </h3>
              </div>
              <div class="flex items-center gap-1 text-tenno-gold font-mono font-bold">
                @if (item.formaCount > 0) {
                  <span class="text-xs text-gray-400">FORMA</span> {{ item.formaCount }}
                }
              </div>
            </div>

            <div class="mb-4">
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="px-2 py-1 bg-white/10 text-white text-xs border border-white/20 rounded">
                  {{ item.type }}
                </span>
                <span class="px-2 py-1 text-xs border rounded flex items-center gap-1"
                      [class.bg-tenno-gold/10]="item.status === 'Mastered'"
                      [class.text-tenno-gold]="item.status === 'Mastered'"
                      [class.border-tenno-gold/30]="item.status === 'Mastered'"
                      [class.bg-tenno-cyan/10]="item.status === 'Forma-ing'"
                      [class.text-tenno-cyan]="item.status === 'Forma-ing'"
                      [class.border-tenno-cyan/30]="item.status === 'Forma-ing'"
                      [class.bg-gray-800]="item.status === 'Building'"
                      [class.text-gray-400]="item.status === 'Building'"
                      [class.border-gray-600]="item.status === 'Building'">
                  {{ item.status }}
                </span>
              </div>
            </div>

            <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div class="h-full transition-all duration-500"
                   [class.bg-tenno-gold]="item.status === 'Mastered'"
                   [class.bg-tenno-cyan]="item.status === 'Forma-ing'"
                   [class.bg-gray-600]="item.status === 'Building'"
                   [style.width.%]="item.status === 'Mastered' ? 100 : (item.status === 'Forma-ing' ? 50 : 10)"></div>
            </div>
            
            <div class="flex justify-end">
              <button (click)="addForma(item)" class="text-xs bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded border border-white/10 transition-colors">
                + Add Forma
              </button>
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
export class ArsenalComponent {
  service = inject(GuildService);

  showAddForm = signal(false);
  searchQuery = signal('');
  filterType = signal('All');
  sortBy = signal('name');

  newItem: Omit<ArsenalItem, 'id' | 'uid'> = {
    name: '',
    type: 'Warframe',
    status: 'Building',
    formaCount: 0
  };

  totalForma = computed(() => {
    return this.service.arsenal().reduce((acc, item) => acc + item.formaCount, 0);
  });

  filteredAndSortedArsenal = computed(() => {
    let items = this.service.arsenal();
    const query = this.searchQuery().toLowerCase();
    const type = this.filterType();
    const sort = this.sortBy();

    if (query) {
      items = items.filter(item => item.name.toLowerCase().includes(query));
    }

    if (type !== 'All') {
      items = items.filter(item => item.type === type);
    }

    return items.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'forma') {
        return b.formaCount - a.formaCount;
      } else if (sort === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  });

  async addItem() {
    if (this.newItem.name) {
      await this.service.addArsenalItem(this.newItem);
      this.showAddForm.set(false);
      this.newItem = { name: '', type: 'Warframe', status: 'Building', formaCount: 0 };
    }
  }

  async addForma(item: ArsenalItem) {
    await this.service.updateArsenalItem(item.id, { formaCount: item.formaCount + 1 });
  }

  async deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this item?')) {
      await this.service.deleteArsenalItem(id);
    }
  }
}
