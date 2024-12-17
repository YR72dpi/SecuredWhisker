<?php

namespace App\Tests;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;

class UserTest extends ApiTestCase
{
    public function testIndex(): void
    {
        $response = static::createClient()->request('GET', '/');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'message' => "That's Secured Whisker's user micro service",
            'status' => 200
        ]);
    }

    // public function addUser(): void
    // {
    //     $response = static::createClient()->request('GET', '/');

    //     $this->assertResponseIsSuccessful();
    //     $this->assertJsonContains([
    //         'message' => "That's Secured Whisker's user micro service",
    //         'status' => 200
    //     ]);
    // }

    // public function checkUserPublicKey(): void
    // {
    //     $response = static::createClient()->request('GET', '/');

    //     $this->assertResponseIsSuccessful();
    //     $this->assertJsonContains([
    //         'message' => "That's Secured Whisker's user micro service",
    //         'status' => 200
    //     ]);
    // }
}
