import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelayComponent } from './components/relay/relay.component';
import { CodexComponent } from './components/codex/codex.component';
import { MediaFlowComponent } from './components/media/media-flow.component';
import { TelemetryComponent } from './components/telemetry/telemetry.component';

type Tab = 'relay' | 'codex' | 'media' | 'telemetry';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RelayComponent, CodexComponent, MediaFlowComponent, TelemetryComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  activeTab = signal<Tab>('relay');
  
  // Date Display
  today = computed(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  });

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }
}