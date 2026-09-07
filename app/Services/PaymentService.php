<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Stub integrasi pembayaran. Implementasi gateway kelak cukup mengganti isi
 * createTransaction() dan handleNotification() tanpa mengubah alur order.
 */
final class PaymentService
{
    public function createTransaction(array $order): array
    {
        return [
            'gateway' => null,
            'transaction_id' => null,
            'status' => 'pending',
            'payment_url' => null,
            'message' => 'Payment gateway belum tersedia.',
        ];
    }

    public function handleNotification(array $payload): bool
    {
        return false;
    }
}

