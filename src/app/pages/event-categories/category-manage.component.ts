import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EventCategory, EventCategoryService } from '../../core/services/event-category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-manage',
  templateUrl: './category-manage.component.html',
  styleUrls: ['./category-manage.component.scss'],
})
export class CategoryManageComponent implements OnInit {
  categories: EventCategory[] = [];
  loading = false;
  saving = false;
  error = '';
  
  categoryForm!: UntypedFormGroup;
  submitted = false;
  editingCategory: EventCategory | null = null;
  isModalOpen = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private categoryService: EventCategoryService,
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
    });
    this.loadCategories();
  }

  get f() {
    return this.categoryForm.controls;
  }

  async loadCategories() {
    this.loading = true;
    this.error = '';
    try {
      const res = await this.categoryService.findAll();
      this.categories = res.data || [];
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat kategori event.';
    } finally {
      this.loading = false;
    }
  }

  openCreateModal() {
    this.editingCategory = null;
    this.submitted = false;
    this.categoryForm.reset();
    this.isModalOpen = true;
  }

  openEditModal(category: EventCategory) {
    this.editingCategory = category;
    this.submitted = false;
    this.categoryForm.patchValue({
      name: category.name,
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async onSubmit() {
    this.submitted = true;
    if (this.categoryForm.invalid) return;

    this.saving = true;
    const name = this.categoryForm.value.name.trim();

    try {
      if (this.editingCategory) {
        await this.categoryService.update(this.editingCategory.id, name);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Kategori event berhasil diperbarui.',
          icon: 'success',
          confirmButtonColor: '#3577f1',
        });
      } else {
        await this.categoryService.create(name);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Kategori event baru berhasil ditambahkan.',
          icon: 'success',
          confirmButtonColor: '#3577f1',
        });
      }
      this.closeModal();
      await this.loadCategories();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err?.message || 'Gagal menyimpan kategori event.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    } finally {
      this.saving = false;
    }
  }

  async deleteCategory(category: EventCategory) {
    const result = await Swal.fire({
      title: 'Hapus Kategori?',
      text: `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await this.categoryService.remove(category.id);
      Swal.fire({
        title: 'Terhapus!',
        text: 'Kategori event telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });
      await this.loadCategories();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err?.message || 'Gagal menghapus kategori event.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    }
  }
}
