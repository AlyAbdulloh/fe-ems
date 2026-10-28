import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OrderService,
  OrderView,
  PaymentMethod,
  PaymentStatusType,
} from '../../../core/services/order.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-my-order-detail',
  templateUrl: './my-order-detail.component.html',
  styleUrls: ['./my-order-detail.component.scss'],
})
export class MyOrderDetailComponent implements OnInit {
  apiUrl: string = environment.url;
  order: OrderView | null = null;
  loading = false;
  error = '';
  submitting = false;

  selectedMethod: PaymentMethod = 'BANK_TRANSFER';

  paymentMethods: PaymentMethodOption[] = [
    {
      value: 'BANK_TRANSFER',
      label: 'Transfer Bank',
      desc: 'Transfer manual via rekening bank',
      icon: 'ri-bank-line',
    },
    {
      value: 'VIRTUAL_ACCOUNT',
      label: 'Virtual Account',
      desc: 'Pembayaran via nomor VA unik',
      icon: 'ri-account-pin-circle-line',
    },
    {
      value: 'EWALLET',
      label: 'E-Wallet',
      desc: 'GoPay, OVO, DANA, dll',
      icon: 'ri-wallet-3-line',
    },
    {
      value: 'CREDIT_CARD',
      label: 'Kartu Kredit',
      desc: 'Visa, Mastercard, dll',
      icon: 'ri-credit-card-2-line',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  async loadOrder(id: string) {
    this.loading = true;
    this.error = '';
    try {
      const res = await this.orderService.findOne(id);
      this.order = res.data || null;
      if (this.order?.payment?.method) {
        this.selectedMethod = this.order.payment.method as PaymentMethod;
      }
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'Gagal memuat detail pesanan.';
    } finally {
      this.loading = false;
    }
  }

  get isUnpaid(): boolean {
    const status = this.order?.payment?.status;
    return status === 'PENDING' || status === 'FAILED' || status === 'UNPAID';
  }

  async pay() {
    if (!this.order) return;
    this.submitting = true;
    try {
      const res = await this.orderService.pay(this.order.id, {
        paymentMethod: this.selectedMethod,
      });
      this.order = res.data || this.order;
      Swal.fire({
        title: 'Pembayaran Berhasil!',
        text: 'Pesanan Anda telah dibayar dan tiket aktif.',
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Pembayaran Gagal!',
        text: err?.error?.message || err?.message || 'Terjadi kesalahan saat membayar.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    } finally {
      this.submitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/events/my-orders']);
  }

  formatOrderId(id: string): string {
    const strId = String(id).substring(0, 8).toUpperCase();
    return `ORD-${new Date().getFullYear()}-${strId}`;
  }

  getTotalQuantity(order: OrderView): number {
    return (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getVenue(order: OrderView): string {
    const venue = order.event?.venue;
    if (!venue?.name) return '';
    return venue.city ? `${venue.name}, ${venue.city}` : venue.name;
  }

  getPaymentStatusClass(status?: PaymentStatusType): string {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return 'status-paid';
      case 'PENDING':
        return 'status-pending';
      case 'FAILED':
        return 'status-failed';
      case 'REFUNDED':
        return 'status-refunded';
      case 'EXPIRED':
        return 'status-expired';
      default:
        return 'status-default';
    }
  }

  getPaymentLabel(status?: PaymentStatusType): string {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return 'Lunas';
      case 'PENDING':
        return 'Menunggu Pembayaran';
      case 'FAILED':
        return 'Gagal';
      case 'REFUNDED':
        return 'Dikembalikan';
      case 'EXPIRED':
        return 'Kedaluwarsa';
      default:
        return 'Belum Dibayar';
    }
  }
}
