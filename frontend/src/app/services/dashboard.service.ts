import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.get<DashboardStats>('dashboard/stats').subscribe({
      next: (res) => {
        this._stats.set(res.data);
        this._loading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          (err?.status === 0
            ? 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.'
            : 'No se pudieron cargar las estadísticas del panel.');
        this._error.set(msg);
        this._stats.set(null);
        this._loading.set(false);
      },
    });
  }
}
