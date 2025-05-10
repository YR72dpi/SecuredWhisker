<?php

namespace App\Security;

use App\Entity\User;
use App\Service\CryptService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTManager;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface as UserProvider;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;

class CustomAuthenticator extends AbstractAuthenticator
{

    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private CryptService $cryptService,
        private AuthenticationSuccessHandler $authenticationSuccessHandler,
        private LoggerInterface $logger,
        private JWTTokenManagerInterface $jwtManager, // <- ici
    ) {}

    public function supports(Request $request): ?bool
    {
        $this->logger->info('Checking if request is supported', ['path' => $request->getPathInfo(), 'method' => $request->getMethod()]);
        return $request->getPathInfo() === '/api/user/login' && $request->isMethod('POST');
    }

    public function authenticate(Request $request): Passport
    {
        $data = json_decode($request->getContent(), true);

        $username = $data['username'] ?? '';
        $encryptedPassword = $data['password'] ?? '';

        // Déchiffrer le mot de passe
        $password = $this->cryptService->decrypt($encryptedPassword);

        $user = $this->em->getRepository(User::class)->findOneBy(['username' => $username]);

        if (!$user || !$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new AuthenticationException('Invalid credentials');
        }

        // return new SelfValidatingPassport($user, [new RememberMeBadge()]);
        return new SelfValidatingPassport(
            new UserBadge($user->getUserIdentifier(), fn() => $user),
            [new RememberMeBadge()]
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?JsonResponse
    {

        /** @var User $user */
        $user = $token->getUser();

        $jwt = $this->jwtManager->create($user);

        return new JsonResponse([
            'ok' => true,
            'message' => 'Authentication ok',
            'user'  => $user->getUserIdentifier(),
            'token' => $jwt // Remplace par ton vrai JWT ou autre
        ]);
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?JsonResponse
    {
        return new JsonResponse([
            'ok' => false,
            'message' => 'Authentication failed',
            'token' => null
        ], JsonResponse::HTTP_UNAUTHORIZED);
    }

    //    public function start(Request $request, ?AuthenticationException $authException = null): Response
    //    {
    //        /*
    //         * If you would like this class to control what happens when an anonymous user accesses a
    //         * protected page (e.g. redirect to /login), uncomment this method and make this class
    //         * implement Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface.
    //         *
    //         * For more details, see https://symfony.com/doc/current/security/experimental_authenticators.html#configuring-the-authentication-entry-point
    //         */
    //    }
}
