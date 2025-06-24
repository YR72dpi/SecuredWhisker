<?php

namespace App\Entity;

use App\Repository\FriendshipRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FriendshipRepository::class)]
class Friendship
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'friendships')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $requestFrom = null;

    #[ORM\ManyToOne(inversedBy: 'friendships')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $requestTo = null;

    #[ORM\Column]
    private ?bool $isAccepted = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRequestFrom(): ?User
    {
        return $this->requestFrom;
    }

    public function setRequestFrom(?User $requestFrom): static
    {
        $this->requestFrom = $requestFrom;

        return $this;
    }

    public function getRequestTo(): ?User
    {
        return $this->requestTo;
    }

    public function setRequestTo(?User $requestTo): static
    {
        $this->requestTo = $requestTo;

        return $this;
    }

    public function isAccepted(): ?bool
    {
        return $this->isAccepted;
    }

    public function setAccepted(bool $isAccepted): static
    {
        $this->isAccepted = $isAccepted;

        return $this;
    }
}
