<?php

namespace App\Tests;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class UserTest extends ApiTestCase
{
    private EntityManagerInterface $entityManager;
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        // Boot the Symfony kernel
        $kernel = self::bootKernel();

        // Get the EntityManager from the service container
        $this->entityManager = $kernel->getContainer()
            ->get('doctrine')
            ->getManager();
        $this->userRepository = $this->entityManager->getRepository(User::class);
            
    }

    public function testIndex(): void
    {
        $response = static::createClient()->request('GET', '/');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'message' => "That's Secured Whisker's user micro service",
            'status' => 200
        ]);
    }

    public function testSubscribeSuccess()
    {
        $client = static::createClient();

        $data = json_encode([
            'username' => 'testuser',
            'password' => 'securepassword',
            'publicKey' => 'testPublicKey123'
        ]);

        $client->request(
            'POST',
            '/api/user/subscribe',
            ["body" => $data],
            [],
            ['CONTENT_TYPE' => 'application/json'],
        );

        $this->assertResponseStatusCodeSame(201);

        $responseContent = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('User registered successfully', $responseContent['message']);

        $foundUser = $this->userRepository->findOneBy(['username' => 'testuser']);

        // Vérifier que l'utilisateur est bien trouvé
        $this->assertNotNull($foundUser);
        $this->assertSame('testPublicKey123', $foundUser->getPublicKey());
    }

    public function testSubscribeSameUser()
    {
        $client = static::createClient();

        $data = json_encode([
            'username' => 'testuser',
            'password' => 'securepassword',
            'publicKey' => 'testPublicKey123'
        ]);

        $client->request(
            'POST',
            '/api/user/subscribe',
            ["body" => $data],
            [],
            ['CONTENT_TYPE' => 'application/json'],
        );

        $this->assertResponseStatusCodeSame(409);
    }

    
    public function checkUserPublicKey(): void
    {
        $userTest = $this->userRepository->findOneBy(["username" => "testuser"]);

        $response = static::createClient()->request('GET', '/api/user/publicKey/'.$userTest->getId());

        $this->assertResponseStatusCodeSame(400);
        $this->assertResponseIsSuccessful();
    }

    
    public function testRemoveUser()
    {
       try { 
            $userTest = $this->userRepository->findOneBy(["username" => "testuser"]);
            $this->assertNotNull($userTest);
            $this->entityManager->remove($userTest);
            $this->entityManager->flush();
            $this->assertIsBool(true);
            
        } catch (\Throwable $err) {
            $this->fail("Remove user with entity manager: ".$err->getMessage());
       }
    }

    public function testSubscribeValidationError()
    {
        $client = static::createClient();

        $data = json_encode([
            'username' => 'testFakeTwinUser',
            'password' => 'verysecuredpassword'
        ]);

        $client->request(
            'POST',
            '/api/user/subscribe',
            ["body" => $data],
            [],
            ['CONTENT_TYPE' => 'application/json'],
        );

        $this->assertResponseStatusCodeSame(400);
    }
}
