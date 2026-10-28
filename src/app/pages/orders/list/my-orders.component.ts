import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, OrderStatusType, OrderView, PaymentStatusType } from '../../../core/services/order.service';
import { PaginationMeta } from '../../../core/models/api-response.model';
import { environment } from 'src/environments/environment';

export interface FilterTab {
  label: string;
  value: '' | OrderStatusType;
}

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
})
export class MyOrdersComponent implements OnInit {
  apiUrl: string = environment.url;
  orders: OrderView[] = [];
  loading = false;
  error = '';

  page = 1;
  limit = 10;
  statusFilter: OrderStatusType | '' = '';
  meta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

  filterTabs: FilterTab[] = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Expired', value: 'EXPIRED' },
  ];

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    this.error = '';

    try {
      const res = await this.orderService.findMyOrders({
        page: this.page,
        limit: this.limit,
        status: this.statusFilter || undefined,
      });

      this.orders = res.data || [];
      if (res.meta) {
        this.meta = res.meta;
      }
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat daftar pesanan Anda.';
    } finally {
      this.loading = false;
    }
  }

  selectTab(value: '' | OrderStatusType) {
    this.statusFilter = value;
    this.page = 1;
    this.loadOrders();
  }

  onFilterChange() {
    this.page = 1;
    this.loadOrders();
  }

  changePage(newPage: number) {
    this.page = newPage;
    this.loadOrders();
  }

  viewDetail(orderId: string | number) {
    this.router.navigate(['/events/my-orders', orderId]);
  }

  continuePayment(order: OrderView) {
    this.router.navigate(['/events/my-orders', order.id]);
  }

  getPaymentBadgeClass(status?: PaymentStatusType): string {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return 'badge-paid';
      case 'PENDING':
        return 'badge-pending';
      case 'FAILED':
        return 'badge-failed';
      case 'REFUNDED':
        return 'badge-refunded';
      case 'EXPIRED':
        return 'badge-expired';
      default:
        return 'badge-secondary';
    }
  }

  getPaymentDotClass(status?: PaymentStatusType): string {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return 'is-success';
      case 'PENDING':
        return 'is-pending';
      case 'FAILED':
        return 'is-failed';
      case 'REFUNDED':
        return 'is-refunded';
      case 'EXPIRED':
        return 'is-expired';
      default:
        return 'is-muted';
    }
  }

  getPaymentLabel(status?: PaymentStatusType): string {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return 'PAID';
      case 'PENDING':
        return 'PENDING';
      case 'FAILED':
        return 'FAILED';
      case 'REFUNDED':
        return 'REFUNDED';
      case 'EXPIRED':
        return 'EXPIRED';
      default:
        return 'UNPAID';
    }
  }

  getTotalQuantity(order: OrderView): number {
    return (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getVenue(order: OrderView): string {
    const venue = order.event?.venue;
    if (!venue?.name) {
      return '';
    }
    return venue.city ? `${venue.name}, ${venue.city}` : venue.name;
  }

  isPending(order: OrderView): boolean {
    return order.payment?.status === 'PENDING';
  }

  isPaid(order: OrderView): boolean {
    return order.payment?.status === 'PAID' || order.payment?.status === 'SUCCESS';
  }

  isExpired(order: OrderView): boolean {
    return order.payment?.status === 'EXPIRED';
  }

  formatOrderId(id: string | number): string {
    const strId = String(id).padStart(3, '0');
    const year = new Date().getFullYear();
    return `ORD-${year}-${strId}`;
  }

  getOrderBadgeClass(status?: OrderStatusType): string {
    switch (status) {
      case 'PAID':
        return 'badge-paid';
      case 'PENDING':
        return 'badge-pending';
      case 'FAILED':
        return 'badge-failed';
      case 'REFUNDED':
        return 'badge-refunded';
      case 'EXPIRED':
        return 'badge-expired';
      default:
        return 'badge-secondary';
    }
  }
}
