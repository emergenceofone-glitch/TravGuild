import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-telemetry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-mono font-bold text-white mb-1">Hardware Telemetry</h2>
          <p class="text-gray-400 text-sm">Remote link to Unit: GALACTUS (Raspberry Pi 5)</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span class="font-mono text-green-500 text-sm">CONNECTED</span>
        </div>
      </div>

      <!-- Main Dashboard -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Thermal Gauge -->
        <div class="glass-panel p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
          <div class="absolute top-2 left-3 text-xs text-gray-500 font-mono">CORE_TEMP</div>
          
          <div class="relative w-40 h-40 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#333" stroke-width="12" fill="transparent" />
              <circle cx="80" cy="80" r="70" stroke="#ff0055" stroke-width="12" fill="transparent"
                      stroke-dasharray="440" [attr.stroke-dashoffset]="440 - (440 * temp() / 100)"
                      class="transition-all duration-1000 ease-out" />
            </svg>
            <div class="absolute text-center">
              <div class="text-4xl font-mono font-bold text-white">{{ temp() | number:'1.1-1' }}°</div>
              <div class="text-xs text-gray-400">CELSIUS</div>
            </div>
          </div>
          <div class="mt-4 w-full">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>Sensor A</span>
              <span>{{ temp() - 0.5 | number:'1.1-1' }}</span>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>Sensor B</span>
              <span>{{ temp() + 0.5 | number:'1.1-1' }}</span>
            </div>
          </div>
        </div>

        <!-- Gyro RPM -->
        <div class="glass-panel p-6 rounded-lg flex flex-col relative overflow-hidden">
          <div class="absolute top-2 left-3 text-xs text-gray-500 font-mono">KINETICS_ARRAY</div>
          
          <div class="flex-1 flex flex-col justify-center space-y-6 mt-2">
            <!-- X Axis -->
            <div>
              <div class="flex justify-between mb-1 text-xs font-mono text-tenno-cyan">
                <span>AXIS_X</span>
                <span>{{ rpmX() }}%</span>
              </div>
              <div class="h-1.5 bg-gray-800 w-full rounded-full overflow-hidden">
                <div class="h-full bg-tenno-cyan transition-all duration-300" [style.width.%]="rpmX()"></div>
              </div>
            </div>
            <!-- Y Axis -->
            <div>
              <div class="flex justify-between mb-1 text-xs font-mono text-tenno-cyan">
                <span>AXIS_Y</span>
                <span>{{ rpmY() }}%</span>
              </div>
              <div class="h-1.5 bg-gray-800 w-full rounded-full overflow-hidden">
                <div class="h-full bg-tenno-cyan transition-all duration-300" [style.width.%]="rpmY()"></div>
              </div>
            </div>
            <!-- Z Axis -->
            <div>
              <div class="flex justify-between mb-1 text-xs font-mono text-tenno-cyan">
                <span>AXIS_Z</span>
                <span>{{ rpmZ() }}%</span>
              </div>
              <div class="h-1.5 bg-gray-800 w-full rounded-full overflow-hidden">
                <div class="h-full bg-tenno-cyan transition-all duration-300" [style.width.%]="rpmZ()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Log -->
        <div class="glass-panel p-4 rounded-lg flex flex-col font-mono text-xs overflow-hidden">
           <div class="text-gray-500 mb-2 border-b border-gray-800 pb-2">DELTA_TRIODE_OS.LOG</div>
           <div class="flex-1 overflow-hidden relative">
             <div class="absolute bottom-0 left-0 w-full space-y-1">
               @for (log of logs(); track $index) {
                 <div class="opacity-80">
                   <span class="text-gray-500">[{{ log.time }}]</span> 
                   <span [ngClass]="log.color">{{ log.msg }}</span>
                 </div>
               }
             </div>
           </div>
        </div>
      </div>

      <!-- LED Visualizer -->
      <div class="glass-panel p-6 rounded-lg flex items-center gap-6">
        <div class="w-16 h-16 rounded-full border-4 border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center transition-colors duration-1000"
             [style.background-color]="haloColor()"
             [style.box-shadow]="'0 0 30px ' + haloColor()">
             <div class="w-12 h-12 bg-black rounded-full"></div>
        </div>
        <div>
           <div class="text-white font-bold font-mono text-lg">Aetherium Halo Status</div>
           <div class="text-gray-400 text-sm">Visual feedback synchronized with thermal load.</div>
           <div class="text-xs mt-1" [style.color]="haloColor()">CURRENT STATE: {{ haloState() }}</div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TelemetryComponent implements OnDestroy {
  temp = signal(35.0);
  rpmX = signal(10);
  rpmY = signal(12);
  rpmZ = signal(11);
  logs = signal<{time: string, msg: string, color: string}[]>([
    {time: '05:00:01', msg: 'System Boot Sequence Initiated', color: 'text-white'},
    {time: '05:00:03', msg: 'Sensors Online', color: 'text-green-500'},
  ]);

  interval: any;

  constructor() {
    this.interval = setInterval(() => {
      this.simulateHardware();
    }, 2000);
  }

  haloColor() {
    const t = this.temp();
    if (t < 40) return '#00d4ff'; // Cyan
    if (t < 50) return '#d4af37'; // Gold
    return '#ff0055'; // Red
  }

  haloState() {
    const t = this.temp();
    if (t < 40) return 'STABLE / COOLING';
    if (t < 50) return 'OPTIMAL / WORKING';
    return 'WARNING / HEAT PURGE';
  }

  simulateHardware() {
    // Fluctuate Temp
    const currentTemp = this.temp();
    const delta = (Math.random() - 0.4) * 2; // Bias slightly up
    let newTemp = currentTemp + delta;
    if (newTemp < 30) newTemp = 30;
    if (newTemp > 65) newTemp = 65; // Cap
    this.temp.set(newTemp);

    // RPM follows temp (P-Controller logic from python script)
    const error = Math.max(0, newTemp - 30);
    const targetSpeed = Math.min(50, error * 2);
    
    // Add some noise to RPMs
    this.rpmX.set(Math.floor(targetSpeed + (Math.random() * 5)));
    this.rpmY.set(Math.floor(targetSpeed + (Math.random() * 5)));
    this.rpmZ.set(Math.floor(targetSpeed + (Math.random() * 5)));

    // Add Log
    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
    let msg = `Temp: ${newTemp.toFixed(1)}°C | Gyro: ${targetSpeed.toFixed(0)}%`;
    let color = 'text-gray-400';
    
    if (newTemp > 50) {
       msg = `WARNING: Thermal Load High (${newTemp.toFixed(1)}°C)`;
       color = 'text-tenno-red';
    }

    this.logs.update(logs => {
      const newLogs = [...logs, { time: now, msg, color }];
      if (newLogs.length > 5) newLogs.shift();
      return newLogs;
    });
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }
}