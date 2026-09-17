import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventCreateComponent } from './event-create.component';
import { EventManageComponent } from './event-manage.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: 'create',
    component: EventCreateComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
  {
    path: 'manage',
    component: EventManageComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
