import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { MyOrdersComponent } from './list/my-orders.component';
import { MyOrderDetailComponent } from './detail/my-order-detail.component';

const routes: Routes = [
  {
    path: 'my-orders',
    component: MyOrdersComponent,
    canActivate: [RoleGuard],
    data: { roles: ['USER', 'ORGANIZER'] },
  },
  {
    path: 'my-orders/:id',
    component: MyOrderDetailComponent,
    canActivate: [RoleGuard],
    data: { roles: ['USER', 'ORGANIZER'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersRoutingModule {}
