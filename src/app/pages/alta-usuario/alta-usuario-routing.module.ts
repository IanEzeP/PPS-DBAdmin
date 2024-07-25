import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AltaUsuarioPage } from './alta-usuario.page';

const routes: Routes = [
  {
    path: '',
    component: AltaUsuarioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AltaUsuarioPageRoutingModule {}
