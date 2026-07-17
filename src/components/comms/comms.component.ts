import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuildService } from '../../services/guild.service';
import { GoogleGenAI } from '@google/genai';

interface SocialPost {
  handle: string;
  content: string;
  time: string;
  avatarColor: string;
}

@Component({
  selector: 'app-comms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fadeIn h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">Comms Link: X</h2>
          <p class="text-gray-400 text-sm">Broadcast guild updates & monitor network chatter.</p>
        </div>
        <div class="flex items-center gap-4">
          <button (click)="syncNetwork()" [disabled]="isSyncing()" 
                  class="group px-4 py-2 bg-tenno-dark border border-gray-700 hover:border-tenno-cyan text-gray-300 hover:text-white rounded transition-all flex items-center gap-2">
            <svg [class.animate-spin]="isSyncing()" class="w-4 h-4 text-tenno-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="font-mono text-xs uppercase tracking-wider">{{ isSyncing() ? 'SYNCING...' : 'SYNC NETWORK' }}</span>
          </button>
          <div class="hidden md:flex gap-2 text-xs font-mono">
            <span class="px-3 py-1 bg-tenno-cyan/10 text-tenno-cyan border border-tenno-cyan/30 rounded flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M7 21h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z"/></svg>
              SIGNAL: STRONG
            </span>
          </div>
        </div>
      </div>

      @if (apiError()) {
        <div class="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div>
            <h4 class="font-bold text-sm">Communication Error</h4>
            <p class="text-xs">{{ apiError() }}</p>
          </div>
          <button (click)="apiError.set(null)" class="ml-auto text-red-400 hover:text-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <!-- Left Column: Composer -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <div class="glass-panel p-6 rounded-lg flex flex-col gap-4 flex-1">
            <div class="flex justify-between items-center mb-2">
               <h3 class="font-mono font-bold text-gray-300 text-sm uppercase">Broadcast Composer</h3>
               <label class="flex items-center gap-2 cursor-pointer group">
                 <input type="checkbox" [(ngModel)]="includeTrends" class="w-4 h-4 rounded border-gray-700 text-tenno-cyan focus:ring-tenno-cyan bg-transparent">
                 <span class="text-xs text-gray-500 group-hover:text-tenno-cyan transition-colors font-mono">INCLUDE NETWORK TRENDS (SEARCH)</span>
               </label>
            </div>

            <div class="flex gap-2 mb-2">
              <input type="text" [(ngModel)]="customPrompt" placeholder="Custom AI Prompt (e.g., 'Make it sound like a Corpus merchant')" class="flex-1 bg-black/50 border border-white/10 rounded p-2 text-white focus:border-tenno-cyan outline-none text-sm">
            </div>

            <textarea class="w-full flex-1 bg-tenno-dark border rounded p-4 text-gray-300 focus:outline-none transition-colors min-h-[150px] resize-none font-sans text-lg"
                      [class.border-tenno-red]="charCount() > 280"
                      [class.focus:border-tenno-red]="charCount() > 280"
                      [class.border-gray-700]="charCount() <= 280"
                      [class.focus:border-tenno-gold]="charCount() <= 280"
                      placeholder="Compose message for broadcast..."
                      [(ngModel)]="postContent"></textarea>
            
            @if (generatedImage()) {
              <div class="relative w-full max-w-md mx-auto mt-2 rounded-lg overflow-hidden border border-white/10">
                <img [src]="generatedImage()" alt="Generated Broadcast Image" class="w-full h-auto object-cover">
                <button (click)="generatedImage.set(null)" class="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            }

            <!-- Grounding Sources Display -->
            @if (groundingMetadata()) {
              <div class="text-xs bg-black/30 p-2 rounded border border-gray-800">
                <span class="text-gray-500 font-mono block mb-1">DATA SOURCES:</span>
                <div class="flex flex-wrap gap-2">
                  @for (chunk of groundingMetadata().groundingChunks || []; track $index) {
                    @if (chunk.web?.uri) {
                      <a [href]="chunk.web.uri" target="_blank" class="text-tenno-cyan hover:underline truncate max-w-[200px] block">
                        {{ chunk.web.title || 'Source Reference' }} ↗
                      </a>
                    }
                  }
                </div>
              </div>
            }

            <div class="flex flex-wrap gap-4 justify-between items-center pt-2 border-t border-gray-800/50">
              <div class="flex gap-2">
                <button (click)="generatePostSuggestion()" [disabled]="isGenerating() || isGeneratingImage()"
                        class="px-4 py-2 bg-tenno-cyan/10 text-tenno-cyan border border-tenno-cyan/30 rounded hover:bg-tenno-cyan/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold tracking-wide">
                  @if(isGenerating()) {
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>ANALYZING...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>AI SUGGEST</span>
                  }
                </button>

                <button (click)="generateImage()" [disabled]="isGenerating() || isGeneratingImage() || postContent().length === 0"
                        class="px-4 py-2 bg-tenno-gold/10 text-tenno-gold border border-tenno-gold/30 rounded hover:bg-tenno-gold/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold tracking-wide"
                        title="Generate an image based on the current post content">
                  @if(isGeneratingImage()) {
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>RENDERING...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>GEN IMAGE</span>
                  }
                </button>

                <button (click)="generateDailyBriefing()" [disabled]="isGenerating() || isGeneratingImage()"
                        class="px-4 py-2 bg-gray-500/10 text-gray-300 border border-gray-500/30 rounded hover:bg-gray-500/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold tracking-wide"
                        title="Summarize guild daily progress (Media & Codex)">
                  @if(isGenerating()) {
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>ANALYZING...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>DAILY BRIEFING</span>
                  }
                </button>
              </div>

              <div class="flex items-center gap-4">
                <input type="datetime-local" [(ngModel)]="scheduledTime" 
                       class="bg-black/50 border border-white/10 rounded px-3 py-2 text-gray-400 focus:border-tenno-cyan outline-none text-sm font-mono cursor-pointer transition-colors hover:border-white/30" 
                       title="Schedule Broadcast (Optional)">
                <span class="text-xs font-mono transition-colors duration-200" 
                      [class.text-tenno-red]="charCount() > 280"
                      [class.font-bold]="charCount() > 280"
                      [class.text-gray-500]="charCount() <= 280">
                  {{ charCount() }} / 280
                  @if (charCount() > 280) {
                    <span class="ml-1 animate-pulse">(! OVER LIMIT)</span>
                  }
                </span>

                <button (click)="transmitPost()" [disabled]="isTransmitting() || postContent().length === 0 || charCount() > 280"
                        class="px-6 py-2 bg-tenno-gold text-black font-bold uppercase tracking-wider rounded hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm disabled:bg-gray-700 disabled:text-gray-500">
                  @if(isTransmitting()) {
                    <span>{{ scheduledTime() ? 'SCHEDULING...' : 'SENDING...' }}</span>
                  } @else {
                    <span>{{ scheduledTime() ? 'SCHEDULE' : 'TRANSMIT' }}</span>
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Feeds -->
        <div class="flex flex-col gap-4 min-h-0">
          
          <!-- Incoming Feed -->
          <div class="glass-panel p-4 rounded-lg flex flex-col flex-1 min-h-[300px] overflow-hidden">
             <div class="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
               <span class="text-xs font-mono text-gray-500">INCOMING MENTIONS</span>
               <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             </div>
             
             <div class="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
               @if (incomingFeed().length === 0) {
                 <div class="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                   <svg class="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                   <span class="text-xs font-mono">NO SIGNAL</span>
                   <button (click)="syncNetwork()" class="text-xs text-tenno-cyan hover:underline">Sync to refresh</button>
                 </div>
               } @else {
                 @for (post of incomingFeed(); track $index) {
                   <div class="p-3 bg-white/5 rounded border border-white/5 hover:border-tenno-cyan/30 transition-colors">
                     <div class="flex items-center gap-2 mb-1">
                       <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black" [style.background-color]="post.avatarColor">
                         {{ post.handle.substring(1,3).toUpperCase() }}
                       </div>
                       <div class="flex flex-col">
                         <span class="text-xs font-bold text-gray-300 leading-none">{{ post.handle }}</span>
                         <span class="text-[10px] text-gray-500 leading-none">{{ post.time }}</span>
                       </div>
                     </div>
                     <p class="text-sm text-gray-300 leading-snug">{{ post.content }}</p>
                   </div>
                 }
               }
             </div>
          </div>

          <!-- Outgoing Log -->
          <div class="glass-panel p-4 rounded-lg flex flex-col h-1/3 min-h-[150px] font-mono text-xs overflow-hidden">
            <div class="text-gray-500 mb-2 border-b border-gray-800 pb-2">TRANSMISSION LOG</div>
            <div class="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              @for(log of transmissionLog(); track $index) {
                <div class="opacity-70 border-l-2 border-tenno-gold pl-2 py-1">
                  <div class="flex flex-col mb-1 text-[10px] text-gray-500">
                    <div class="flex justify-between">
                      <span [class.text-tenno-cyan]="log.scheduledFor">
                        {{ log.scheduledFor ? 'QUEUED' : 'OUTBOUND' }}
                      </span>
                      <span>{{ log.timestamp }}</span>
                    </div>
                    @if (log.scheduledFor) {
                      <span class="text-tenno-cyan mt-0.5">SCHED: {{ log.scheduledFor }}</span>
                    }
                  </div>
                  <div class="text-tenno-gold truncate">{{ log.content }}</div>
                  @if (log.hasImage) {
                    <div class="text-tenno-cyan text-[10px] mt-1">[IMAGE ATTACHED]</div>
                  }
                </div>
              }
              @if (transmissionLog().length === 0) {
                 <div class="text-gray-700 italic pt-4 text-center">Ready to transmit...</div>
              }
            </div>
          </div>
        </div>
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
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
  `]
})
export class CommsComponent {
  service = inject(GuildService);
  ai: GoogleGenAI | null = null;
  
  postContent = signal("The latest Tenno's Guild update is live! Check out our new media pipeline features and operator services.");
  customPrompt = signal('');
  includeTrends = signal(false);
  isTransmitting = signal(false);
  isGenerating = signal(false);
  isGeneratingImage = signal(false);
  isSyncing = signal(false);
  scheduledTime = signal<string>('');
  apiError = signal<string | null>(null);
  generatedImage = signal<string | null>(null);
  
  transmissionLog = signal<{content: string, timestamp: string, hasImage?: boolean, scheduledFor?: string}[]>([]);
  incomingFeed = signal<SocialPost[]>([]);
  groundingMetadata = signal<any>(null);
  
  charCount = computed(() => this.postContent().length);

  constructor() {
    if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } else {
      this.apiError.set("GEMINI_API_KEY is not configured. AI features will be disabled.");
    }
  }

  transmitPost() {
    this.isTransmitting.set(true);
    setTimeout(() => {
      const scheduled = this.scheduledTime();
      let scheduledFormatted;
      if (scheduled) {
        const d = new Date(scheduled);
        scheduledFormatted = d.toLocaleDateString() + ' ' + d.toLocaleTimeString('en-GB', { hour12: false });
      }

      const newLog = {
        content: this.postContent(),
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        hasImage: !!this.generatedImage(),
        scheduledFor: scheduledFormatted
      };
      this.transmissionLog.update(logs => [newLog, ...logs].slice(0, 10));
      this.postContent.set('');
      this.generatedImage.set(null);
      this.groundingMetadata.set(null); // Clear context after send
      this.scheduledTime.set('');
      this.isTransmitting.set(false);
    }, 1500);
  }

  async syncNetwork() {
    if (!this.ai) {
      this.apiError.set("Cannot sync network: AI is not initialized.");
      return;
    }
    if (this.isSyncing()) return;
    
    this.isSyncing.set(true);
    this.apiError.set(null);

    try {
      // Create context based on actual app state for realistic fake replies
      const topClip = this.service.clips().find(c => c.status === 'Published');
      const rareFind = this.service.codex().find(c => !c.isLocked);
      
      let promptContext = "We are 'Tenno's Guild'.";
      if (topClip) promptContext += ` We just dropped a video: ${topClip.description}.`;
      if (rareFind) promptContext += ` We found: ${rareFind.discovery}.`;

      const prompt = `Generate 4 realistic social media comments (like tweets) from Warframe players reacting to this context: "${promptContext}". 
      Some should be hyped, some asking for help/invites.
      Return ONLY a JSON array with objects having keys: handle (e.g. @VoidDrifter), content, time (e.g. '2m ago').`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const rawText = response.text.trim();
      // Basic cleanup if markdown fences are present
      const jsonStr = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const newPosts = JSON.parse(jsonStr);
      
      // Add random colors for avatars
      const coloredPosts = newPosts.map((p: any) => ({
        ...p, 
        avatarColor: ['#d4af37', '#00d4ff', '#ff0055', '#a8a8a8'][Math.floor(Math.random()*4)]
      }));

      this.incomingFeed.set(coloredPosts);

    } catch (e: any) {
      console.error("Sync failed", e);
      this.apiError.set(e.message || "Failed to sync network. Please try again.");
    } finally {
      this.isSyncing.set(false);
    }
  }

  async generatePostSuggestion() {
    if (!this.ai) {
      this.apiError.set("Cannot generate suggestion: AI is not initialized.");
      return;
    }
    if (this.isGenerating()) return;
    
    this.isGenerating.set(true);
    this.apiError.set(null);
    this.groundingMetadata.set(null);

    try {
      const publishedClips = this.service.clips().filter(c => c.status === 'Published');
      const unlockedCodex = this.service.codex().filter(c => !c.isLocked);

      let context = "We are a gaming guild called 'Tenno's Guild'.";
      if (publishedClips.length > 0) {
        context += ` We recently published a video: '${publishedClips[0].description}'.`;
      } else if (unlockedCodex.length > 0) {
        context += ` We just decrypted some intel: '${unlockedCodex[0].discovery}'.`;
      } else {
        context += ` We are recruiting new members.`;
      }

      let prompt = `Based on this context: "${context}", write a short, exciting, and professional social media post for X (formerly Twitter). Use relevant hashtags. Max 280 chars.`;
      
      if (this.customPrompt()) {
        prompt += `\n\nAdditional instructions: ${this.customPrompt()}`;
      }
      
      let tools = [];
      if (this.includeTrends()) {
        tools = [{googleSearch: {}}];
        prompt += ` IMPORTANT: First, use Google Search to find the absolute latest News, Updates, or Devstream info for the game 'Warframe' from today/yesterday.
        Then, write the post referencing BOTH our guild update AND the trending news you found to make it relevant.`;
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools }
      });

      this.postContent.set(response.text.trim());
      
      if (response.candidates?.[0]?.groundingMetadata) {
        this.groundingMetadata.set(response.candidates[0].groundingMetadata);
      }

    } catch(e: any) {
      console.error("Error generating content:", e);
      this.apiError.set(e.message || "Failed to generate suggestion. Please try again.");
    } finally {
      this.isGenerating.set(false);
    }
  }

  async generateImage() {
    if (!this.ai) {
      this.apiError.set("Cannot generate image: AI is not initialized.");
      return;
    }
    if (this.isGeneratingImage() || !this.postContent()) return;
    
    this.isGeneratingImage.set(true);
    this.apiError.set(null);

    try {
      const prompt = `A cinematic, high-quality image related to this social media post: "${this.postContent()}". Sci-fi, space ninja aesthetic, dark and moody with neon accents.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          this.generatedImage.set(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
      
      if (!this.generatedImage()) {
        throw new Error("No image data returned from API.");
      }

    } catch(e: any) {
      console.error("Error generating image:", e);
      this.apiError.set(e.message || "Failed to generate image. Please try again.");
    } finally {
      this.isGeneratingImage.set(false);
    }
  }

  async generateDailyBriefing() {
    if (!this.ai) {
      this.apiError.set("Cannot generate briefing: AI is not initialized.");
      return;
    }
    if (this.isGenerating()) return;
    
    this.isGenerating.set(true);
    this.apiError.set(null);
    this.groundingMetadata.set(null);

    try {
      const clips = this.service.clips();
      const codexEntries = this.service.codex();
      
      const publishedClips = clips.filter(c => c.status === 'Published').length;
      const totalClips = clips.length;
      
      const unlockedCodex = codexEntries.filter(c => !c.isLocked).length;
      const totalCodex = codexEntries.length;

      let context = `Our guild currently has ${publishedClips} published media clips out of a total of ${totalClips}. `;
      context += `We have also decrypted ${unlockedCodex} artifacts out of ${totalCodex} total codex entries.`;
      
      let prompt = `Based on these guild statistics: "${context}", write a short, exciting, and professional "Daily Briefing" social media post for X (formerly Twitter) summarizing the guild's daily progress. Use relevant hashtags. Max 280 chars. Make it sound like a space-ninja mission report.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      this.postContent.set(response.text.trim());
    } catch(e: any) {
      console.error("Error generating briefing:", e);
      this.apiError.set(e.message || "Failed to generate briefing. Please try again.");
    } finally {
      this.isGenerating.set(false);
    }
  }
}