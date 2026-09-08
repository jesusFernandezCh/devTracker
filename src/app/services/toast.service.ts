import {Injectable, inject} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({providedIn: 'root'})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: 'snack-success',
    });
  }

  error(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 5000,
      panelClass: 'snack-error',
    });
  }

  info(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: 'snack-info',
    });
  }

  warning(msg: string): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 4000,
      panelClass: 'snack-warning',
    });
  }
}
