<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\FriendshipRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FriendshipRepository::class)]
#[ApiResource]
class Friendship
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(cascade: ['persist', 'remove'])]
    private ?User $requestFrom = null;

    #[ORM\OneToOne(cascade: ['persist', 'remove'])]
    private ?User $requestTo = null;

    #[ORM\Column(options: ["default" => false])]
    private ?bool $isAccepted = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdTime = null;

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

    public function setIsAccepted(bool $isAccepted): static
    {
        $this->isAccepted = $isAccepted;

        return $this;
    }

    public function getCreatedTime(): ?\DateTimeInterface
    {
        return $this->createdTime;
    }

    public function setCreatedTime(\DateTimeInterface $createdTime): static
    {
        $this->createdTime = $createdTime;

        return $this;
    }
}
