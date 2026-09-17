import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VenueManageComponent } from './venue-manage.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: VenueManageComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VenuesRoutingModule {}
