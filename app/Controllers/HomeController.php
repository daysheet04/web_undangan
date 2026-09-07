<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\TemplateRepository;

final class HomeController
{
    public function index(): void
    {
        $templates = (new TemplateRepository(db()))->allActive();
        view('home/index', [
            'title' => 'Temuara — Tempat kisah baik dimulai.',
            'templates' => $templates,
            'pageClass' => 'homepage',
            'styles' => ['homepage.css'],
        ]);
    }
}
