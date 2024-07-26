import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AltaUsuarioPageRoutingModule } from './alta-usuario-routing.module';

import { AltaUsuarioPage } from './alta-usuario.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AltaUsuarioPageRoutingModule
  ],
  declarations: [AltaUsuarioPage]
})
export class AltaUsuarioPageModule {}
