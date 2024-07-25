import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public listUsers: Array<any> = [];

  constructor(private auth: AuthService, private router: Router, private actionSheetCtrl: ActionSheetController) {}

  ngOnInit(): void {
    
  }

  ngOnDestroy(): void {
    
  }

  async displayOptions() {
    let optionsArray: Array<any> = [
      {
        text: 'Cerrar Sesión',
        role: 'destructive',
        data: {
          action: 'logout'
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel',
        data: {
          action: 'cancel'
        }
      }
    ];

    if (this.auth.perfil == 'admin') {
      optionsArray.push(
        {
          text: 'Alta de usuario',
          data: {
            action: 'alta'
          }
        }
      );
      optionsArray.reverse();
    }

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opciones',
      buttons: optionsArray
    });

    await actionSheet.present();

    const { data, role } = await actionSheet.onWillDismiss();
    if (role != 'backdrop') {
      switch (data.action) {
        case 'logout':
          this.cerrarSesion();
          break;
        case 'alta':
          this.router.navigateByUrl('/alta-usuario');
          break;
        default:
          console.log('Canceled');
          break;
      }
    }
  }

  cerrarSesion() {
    Swal.fire({
      heightAuto: false,
      title: '¿Cerrar Sesión?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.logOut().then(() => this.router.navigateByUrl('/login'));
      }
    });
  }
}
