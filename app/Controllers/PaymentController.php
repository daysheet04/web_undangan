<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\OrderRepository;
use App\Repositories\PaymentRepository;
use App\Services\PaymentService;

final class PaymentController
{
    public function show(string $orderCode): void
    {
        $orders = new OrderRepository(db());
        $order = $orders->findByCode($orderCode);
        if (!$order) {
            $this->notFound();
            return;
        }
        if ($order['status'] === 'editing' || $order['status'] === 'published') {
            redirect('/edit/' . rawurlencode($order['editor_token']));
        }
        $payment = (new PaymentRepository(db()))->findByOrder((int) $order['id']);
        $stub = (new PaymentService())->createTransaction($order);
        view('payment/show', [
            'title' => 'Pembayaran ' . $order['order_code'] . ' — Daymoment',
            'order' => $order,
            'payment' => $payment,
            'paymentStub' => $stub,
            'pageClass' => 'payment-page',
        ]);
    }

    public function demo(string $orderCode): void
    {
        verify_csrf();
        $orders = new OrderRepository(db());
        $order = $orders->findByCode($orderCode);
        if (!$order) {
            $this->notFound();
            return;
        }
        if ($order['status'] === 'waiting_payment') {
            $orders->updateStatus((int) $order['id'], 'editing');
        }
        redirect('/edit/' . rawurlencode($order['editor_token']));
    }

    private function notFound(): void
    {
        http_response_code(404);
        view('errors/404', ['title' => 'Order tidak ditemukan', 'message' => 'Kode order tidak ditemukan.']);
    }
}
